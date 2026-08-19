// 전 임직원 공개 대시보드 집계.
//
// 관리자 콘솔이 아니라 메인 화면에서 누구나 보는 화면이라, 개인을 특정해 불이익을 줄 수 있는
// 지표(미사용자 명단 등)는 만들지 않는다. 순위는 상위만 노출한다.
//
// 모든 확산 지표의 원천은 AuditLog(action=agent_run) 한 곳이다.
//   - deptSnapshot : 실행 시점 부서 → "어디까지 퍼졌는가"
//   - targetId     : Agent.id      → "어떤 에이전트가"
// User.dept를 조인하지 않는 이유는 부서 이동·조직개편이 있어도 과거 수치가 흔들리지 않게 하기 위함.
import { db } from "./db";
import { getDivisionHeadcounts, rate } from "./headcount";
import { savedMinutes } from "./time-band";

export type Period = 7 | 30 | 90;

export function normalizePeriod(v: unknown): Period {
  const n = Number(v);
  return n === 30 || n === 90 ? n : 7;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null; // 0에서 늘어난 건 "∞%"라 표기 불가 — 신규로 다룬다
  return Math.round(((current - previous) / previous) * 100);
}

export type KpiCard = {
  key: string;
  label: string;
  value: string;
  unit: string;
  delta: number | null;
  spread?: boolean; // 부서 확산 지표 — 화면에서 따로 묶어 보여준다
};

export type TeamRow = {
  team: string;
  division: string | null;
  runs: number;
  registrations: number;
  activeUsers: number;
  avgRunsPerUser: number;
  delta: number | null;
};

export type DivisionActivityRow = {
  division: string;
  activeUsers: number;
  headcount: number | null;
  activeRate: number | null;
};

export type PersonRow = {
  id: string;
  name: string;
  ava: string;
  team: string;
  runs: number;
  registrations: number;
  score: number;
  badges: ("runs" | "registrations")[];
};

export type CategoryRow = { cat: string; runs: number; registrations: number };

export type SpreadRow = {
  id: string;
  name: string;
  cat: string;
  ownerTeam: string;
  total: number;
  teams: number;
  outsidePct: number; // 등록 팀 밖에서 실행된 비율 — 확산의 핵심 신호
  byTeam: { team: string; runs: number; owner: boolean }[];
};

export type DashboardData = {
  period: Period;
  kpis: KpiCard[];
  savedHours: number;
  teams: TeamRow[];
  powerUser: PersonRow | null;
  individuals: PersonRow[];
  byCategory: CategoryRow[];
  spread: SpreadRow[];
  divisionActivity: {
    rows: DivisionActivityRow[];
    averageRate: number | null;
  };
};

type RunLog = { userId: string; deptSnapshot: string; targetId: string | null };

type SpreadAgent = {
  id: string;
  name: string;
  category: string;
  author: { dept: string };
};

async function runLogsBetween(gte: Date, lt?: Date): Promise<RunLog[]> {
  return db.auditLog.findMany({
    where: { action: "agent_run", createdAt: lt ? { gte, lt } : { gte } },
    select: { userId: true, deptSnapshot: true, targetId: true },
  });
}

function countBy<T, K>(rows: T[], key: (row: T) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const row of rows) m.set(key(row), (m.get(key(row)) ?? 0) + 1);
  return m;
}

/** 구독현황 스냅샷이 유일한 조직도 소스라 팀-부문 관계와 부문 목록을 함께 가져온다. */
async function organizationLookup(): Promise<{
  teamDivisions: Map<string, string>;
  divisionNames: string[];
}> {
  const snapshot = await db.subscriptionSnapshot.findFirst({ orderBy: { period: "desc" } });
  if (!snapshot) return { teamDivisions: new Map(), divisionNames: [] };
  const rows = await db.subscriptionRow.findMany({
    where: { snapshotId: snapshot.id },
    select: { scope: true, name: true, division: true },
    orderBy: { order: "asc" },
  });
  return {
    teamDivisions: new Map(
      rows.flatMap((row) =>
        row.scope === "team" && row.division ? [[row.name, row.division] as const] : [],
      ),
    ),
    divisionNames: rows.filter((row) => row.scope === "division").map((row) => row.name),
  };
}

/** 같은 에이전트가 어느 팀에서 몇 번 실행됐는지 현재·직전 기간에 공통으로 계산한다. */
function buildSpread(
  runs: RunLog[],
  agentById: ReadonlyMap<string, SpreadAgent>,
): { matrix: Map<string, Map<string, number>>; rows: SpreadRow[] } {
  const matrix = new Map<string, Map<string, number>>();
  for (const log of runs) {
    if (!log.targetId || !agentById.has(log.targetId)) continue;
    const teams = matrix.get(log.targetId) ?? new Map<string, number>();
    teams.set(log.deptSnapshot, (teams.get(log.deptSnapshot) ?? 0) + 1);
    matrix.set(log.targetId, teams);
  }

  const rows: SpreadRow[] = [];
  for (const [agentId, teams] of matrix) {
    const agent = agentById.get(agentId)!;
    const ownerTeam = agent.author.dept;
    const entries = [...teams.entries()].sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const own = teams.get(ownerTeam) ?? 0;
    rows.push({
      id: agentId,
      name: agent.name,
      cat: agent.category,
      ownerTeam,
      total,
      teams: entries.length,
      outsidePct: total ? Math.round(((total - own) / total) * 100) : 0,
      byTeam: entries.map(([team, count]) => ({
        team,
        runs: count,
        owner: team === ownerTeam,
      })),
    });
  }

  rows.sort((a, b) => b.total - a.total);
  return { matrix, rows };
}

function averageTeams(rows: SpreadRow[]): number {
  return rows.length ? rows.reduce((sum, row) => sum + row.teams, 0) / rows.length : 0;
}

export async function getDashboardData(period: Period): Promise<DashboardData> {
  const since = daysAgo(period);
  const prevSince = daysAgo(period * 2);

  const [runs, prevRuns, agents, newAgents, prevNewAgents, organization, divisionHeadcounts] =
    await Promise.all([
      runLogsBetween(since),
      runLogsBetween(prevSince, since),
      db.agent.findMany({
        where: { status: "published" },
        select: {
          id: true,
          name: true,
          category: true,
          timeBefore: true,
          timeAfter: true,
          createdAt: true,
          author: { select: { id: true, name: true, dept: true } },
        },
      }),
      db.agent.findMany({
        where: { status: "published", createdAt: { gte: since } },
        select: { category: true, author: { select: { id: true, name: true, dept: true } } },
      }),
      db.agent.findMany({
        where: { status: "published", createdAt: { gte: prevSince, lt: since } },
        select: { id: true },
      }),
      organizationLookup(),
      getDivisionHeadcounts(),
    ]);

  const agentById = new Map(agents.map((a) => [a.id, a]));
  const prevAgentById = new Map(
    agents.filter((agent) => agent.createdAt < since).map((agent) => [agent.id, agent]),
  );

  // ---------- 확산: 에이전트 × 팀 실행 행렬 ----------
  const { matrix: byAgentTeam, rows: spread } = buildSpread(runs, agentById);
  const { rows: prevSpread } = buildSpread(prevRuns, prevAgentById);

  // ---------- 팀 리더보드 ----------
  const runsByTeam = countBy(runs, (r) => r.deptSnapshot);
  const prevRunsByTeam = countBy(prevRuns, (r) => r.deptSnapshot);
  const regsByTeam = countBy(newAgents, (a) => a.author.dept);

  const activeByTeam = new Map<string, Set<string>>();
  for (const run of runs) {
    const set = activeByTeam.get(run.deptSnapshot) ?? new Set<string>();
    set.add(run.userId);
    activeByTeam.set(run.deptSnapshot, set);
  }
  const activeUserIds = new Set(runs.map((run) => run.userId));
  const prevActiveUserIds = new Set(prevRuns.map((run) => run.userId));

  const teamNames = new Set([...runsByTeam.keys(), ...regsByTeam.keys(), ...activeByTeam.keys()]);

  const teams: TeamRow[] = [...teamNames]
    .map((team) => {
      const teamRuns = runsByTeam.get(team) ?? 0;
      const teamRegs = regsByTeam.get(team) ?? 0;
      const users = activeByTeam.get(team)?.size ?? 0;
      return {
        team,
        division: organization.teamDivisions.get(team) ?? null,
        runs: teamRuns,
        registrations: teamRegs,
        activeUsers: users,
        avgRunsPerUser: users ? Math.round((teamRuns / users) * 10) / 10 : 0,
        delta: pctDelta(teamRuns, prevRunsByTeam.get(team) ?? 0),
      };
    })
    .sort((a, b) => b.runs - a.runs);

  // ---------- 부문별 허브 활성률 ----------
  const activeIdsByDivision = new Map<string, Set<string>>();
  for (const run of runs) {
    const division = organization.teamDivisions.get(run.deptSnapshot);
    if (!division) continue;
    const ids = activeIdsByDivision.get(division) ?? new Set<string>();
    ids.add(run.userId);
    activeIdsByDivision.set(division, ids);
  }

  const divisionActivityRows: DivisionActivityRow[] = organization.divisionNames.map((division) => {
    const activeUsers = activeIdsByDivision.get(division)?.size ?? 0;
    const headcount = divisionHeadcounts[division] ?? null;
    return {
      division,
      activeUsers,
      headcount,
      activeRate: rate(activeUsers, headcount),
    };
  });

  const companyActiveIds = new Set<string>();
  let companyHeadcount = 0;
  for (const row of divisionActivityRows) {
    if (row.headcount == null || row.headcount <= 0) continue;
    companyHeadcount += row.headcount;
    for (const userId of activeIdsByDivision.get(row.division) ?? []) {
      companyActiveIds.add(userId);
    }
  }
  const companyActiveRate = rate(companyActiveIds.size, companyHeadcount || null);

  // ---------- 개인 리더보드 ----------
  const runsByUser = countBy(runs, (r) => r.userId);
  const regsByUser = countBy(newAgents, (a) => a.author.id);
  const userInfo = new Map<string, { name: string; dept: string }>();
  for (const a of agents) userInfo.set(a.author.id, { name: a.author.name, dept: a.author.dept });
  for (const a of newAgents) userInfo.set(a.author.id, { name: a.author.name, dept: a.author.dept });

  const missingIds = [...runsByUser.keys()].filter((id) => !userInfo.has(id));
  if (missingIds.length) {
    const found = await db.user.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, name: true, dept: true },
    });
    for (const u of found) userInfo.set(u.id, { name: u.name, dept: u.dept });
  }

  const maxUserRuns = Math.max(0, ...runsByUser.values());
  const maxUserRegs = Math.max(0, ...regsByUser.values());

  const individuals: PersonRow[] = [...new Set([...runsByUser.keys(), ...regsByUser.keys()])]
    .map((id) => {
      const info = userInfo.get(id);
      const userRuns = runsByUser.get(id) ?? 0;
      const userRegs = regsByUser.get(id) ?? 0;
      const badges: PersonRow["badges"] = [];
      if (maxUserRuns > 0 && userRuns === maxUserRuns) badges.push("runs");
      if (maxUserRegs > 0 && userRegs === maxUserRegs) badges.push("registrations");
      return {
        id,
        name: info?.name ?? "(탈퇴)",
        ava: (info?.name ?? "?").charAt(0),
        team: info?.dept ?? "-",
        runs: userRuns,
        registrations: userRegs,
        // PeoplePanel은 3단계에서 대시보드에서 제거된다. 그 전까지 기존 표시값만 유지한다.
        score: Math.round(
          (maxUserRuns > 0 ? (userRuns / maxUserRuns) * 60 : 0) +
            (maxUserRegs > 0 ? (userRegs / maxUserRegs) * 40 : 0),
        ),
        badges,
      };
    })
    .sort((a, b) => b.score - a.score);

  // ---------- 카테고리 ----------
  const runsByCategory = new Map<string, number>();
  for (const log of runs) {
    const agent = log.targetId ? agentById.get(log.targetId) : null;
    if (!agent) continue;
    runsByCategory.set(agent.category, (runsByCategory.get(agent.category) ?? 0) + 1);
  }
  const regsByCategory = countBy(newAgents, (a) => a.category);
  const allCategories = await db.category.findMany({ orderBy: { order: "asc" } });
  const categoryNames = allCategories.length
    ? allCategories.map((c) => c.name)
    : [...new Set(agents.map((a) => a.category))];

  const byCategory: CategoryRow[] = categoryNames
    .map((cat) => ({
      cat,
      runs: runsByCategory.get(cat) ?? 0,
      registrations: regsByCategory.get(cat) ?? 0,
    }))
    .sort((a, b) => b.runs - a.runs);

  // ---------- 절감 시간 ----------
  // 에이전트별 (도입 전 - 도입 후) × 해당 기간 실행 횟수. 등록자가 전/후를 안 넣었으면 0으로 둔다.
  let savedMin = 0;
  for (const [agentId, teams] of byAgentTeam) {
    const agent = agentById.get(agentId)!;
    const perRun = savedMinutes(agent.timeBefore, agent.timeAfter);
    if (!perRun) continue;
    savedMin += perRun * [...teams.values()].reduce((sum, n) => sum + n, 0);
  }

  // ---------- KPI ----------
  const totalRuns = runs.length;
  const spreadOutside = spread.filter((s) => s.outsidePct > 0).length;
  const prevSpreadOutside = prevSpread.filter((row) => row.outsidePct > 0).length;
  const spreadRate = agents.length ? spreadOutside / agents.length : 0;
  const prevSpreadRate = prevAgentById.size ? prevSpreadOutside / prevAgentById.size : 0;
  const avgTeamsPerAgent = averageTeams(spread);
  const prevAvgTeamsPerAgent = averageTeams(prevSpread);
  const participatingTeams = new Set(runs.map((run) => run.deptSnapshot)).size;
  const prevParticipatingTeams = new Set(prevRuns.map((run) => run.deptSnapshot)).size;

  const kpis: KpiCard[] = [
    {
      key: "runs",
      label: "에이전트 실행",
      value: String(totalRuns),
      unit: "회",
      delta: pctDelta(totalRuns, prevRuns.length),
    },
    {
      key: "activeUsers",
      label: "활성 유저",
      value: String(activeUserIds.size),
      unit: "명",
      delta: pctDelta(activeUserIds.size, prevActiveUserIds.size),
    },
    {
      key: "teams",
      label: "참여 부서",
      value: String(participatingTeams),
      unit: "곳",
      delta: pctDelta(participatingTeams, prevParticipatingTeams),
    },
    {
      key: "registrations",
      label: "에이전트 등록",
      value: String(newAgents.length),
      unit: "건",
      delta: pctDelta(newAgents.length, prevNewAgents.length),
    },
    {
      key: "spreadOutside",
      label: "타팀까지 퍼진 에이전트",
      value: String(spreadOutside),
      unit: `/ ${agents.length}건`,
      delta: pctDelta(spreadRate, prevSpreadRate),
      spread: true,
    },
    {
      key: "avgTeams",
      label: "에이전트당 평균 실행 팀",
      value: avgTeamsPerAgent.toFixed(1),
      unit: "팀",
      delta: pctDelta(avgTeamsPerAgent, prevAvgTeamsPerAgent),
      spread: true,
    },
  ];

  return {
    period,
    kpis,
    savedHours: Math.round(savedMin / 60),
    teams,
    powerUser: individuals[0] ?? null,
    individuals: individuals.slice(0, 5),
    byCategory,
    spread,
    divisionActivity: {
      rows: divisionActivityRows,
      averageRate: companyActiveRate,
    },
  };
}
