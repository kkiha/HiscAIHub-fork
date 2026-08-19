// 전 임직원 공개 대시보드 집계.
//
// 관리자 콘솔이 아니라 메인 화면에서 누구나 보는 화면이라, 개인을 특정해 불이익을 줄 수 있는
// 지표(미사용자 명단 등)나 개인별 순위는 만들지 않는다.
//
// 모든 확산 지표의 원천은 AuditLog(action=agent_run) 한 곳이다.
//   - deptSnapshot : 실행 시점 부서 → "어디까지 퍼졌는가"
//   - targetId     : Agent.id      → "어떤 에이전트가"
// User.dept를 조인하지 않는 이유는 부서 이동·조직개편이 있어도 과거 수치가 흔들리지 않게 하기 위함.
import { db } from "./db";
import { getDivisionHeadcounts, rate } from "./headcount";
import { parseTimeBand, savedMinutes } from "./time-band";

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
  divisionActivity: {
    rows: DivisionActivityRow[];
    averageRate: number | null;
  };
  byCategory: CategoryRow[];
  spread: SpreadRow[];
};

type RunLog = { userId: string; deptSnapshot: string; targetId: string | null };

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

/** 실행 로그를 에이전트 × 실행 팀 행렬로 묶는다. 게시된 에이전트의 로그만 집계한다. */
function agentTeamMatrix(
  runs: RunLog[],
  publishedAgentIds: Set<string>,
): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();
  for (const log of runs) {
    if (!log.targetId || !publishedAgentIds.has(log.targetId)) continue;
    const teams = matrix.get(log.targetId) ?? new Map<string, number>();
    teams.set(log.deptSnapshot, (teams.get(log.deptSnapshot) ?? 0) + 1);
    matrix.set(log.targetId, teams);
  }
  return matrix;
}

type SpreadAgent = {
  id: string;
  name: string;
  category: string;
  author: { dept: string };
};

/** 에이전트 × 팀 행렬을 화면과 KPI가 함께 쓰는 확산 행으로 변환한다. */
function spreadRows(
  matrix: Map<string, Map<string, number>>,
  agentById: ReadonlyMap<string, SpreadAgent>,
): SpreadRow[] {
  const rows: SpreadRow[] = [];
  for (const [agentId, teams] of matrix) {
    const agent = agentById.get(agentId);
    if (!agent) continue;
    const ownerTeam = agent.author.dept;
    const entries = [...teams.entries()].sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, n]) => sum + n, 0);
    const own = teams.get(ownerTeam) ?? 0;
    rows.push({
      id: agentId,
      name: agent.name,
      cat: agent.category,
      ownerTeam,
      total,
      teams: entries.length,
      outsidePct: total ? Math.round(((total - own) / total) * 100) : 0,
      byTeam: entries.map(([team, n]) => ({ team, runs: n, owner: team === ownerTeam })),
    });
  }
  return rows.sort((a, b) => b.total - a.total);
}

function averageTeams(rows: SpreadRow[]): number {
  return rows.length ? rows.reduce((sum, row) => sum + row.teams, 0) / rows.length : 0;
}

/** 팀 이름 → 소속 부문과 전체 부문 목록. 구독 스냅샷을 조직도 원천으로 쓴다. */
async function organizationLookup(): Promise<{
  teamDivisions: Map<string, string>;
  divisionNames: string[];
}> {
  const snapshot = await db.subscriptionSnapshot.findFirst({ orderBy: { period: "desc" } });
  if (!snapshot) return { teamDivisions: new Map(), divisionNames: [] };
  const rows = await db.subscriptionRow.findMany({
    where: { snapshotId: snapshot.id },
    select: { scope: true, name: true, division: true },
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

export async function getDashboardData(period: Period): Promise<DashboardData> {
  const since = daysAgo(period);
  const prevSince = daysAgo(period * 2);

  const [
    runs,
    prevRuns,
    agents,
    newAgents,
    prevNewAgents,
    activity,
    prevActivity,
    organization,
    headcounts,
  ] =
    await Promise.all([
      runLogsBetween(since),
      runLogsBetween(prevSince, since),
      db.agent.findMany({
        where: { status: "published" },
        select: {
          id: true,
          name: true,
          category: true,
          createdAt: true,
          timeBefore: true,
          timeAfter: true,
          author: { select: { dept: true } },
        },
      }),
      db.agent.findMany({
        where: { createdAt: { gte: since } },
        select: { category: true, author: { select: { dept: true } } },
      }),
      db.agent.findMany({
        where: { createdAt: { gte: prevSince, lt: since } },
        select: { author: { select: { id: true, dept: true } } },
      }),
      db.auditLog.findMany({
        where: { createdAt: { gte: since } },
        distinct: ["userId"],
        select: { userId: true, deptSnapshot: true },
      }),
      db.auditLog.findMany({
        where: { createdAt: { gte: prevSince, lt: since } },
        distinct: ["userId"],
        select: { userId: true },
      }),
      organizationLookup(),
      getDivisionHeadcounts(),
    ]);

  const agentById = new Map(agents.map((a) => [a.id, a]));
  const publishedAgentIds = new Set(agentById.keys());
  const prevPublishedAgents = agents.filter((agent) => agent.createdAt < since);
  const prevPublishedAgentIds = new Set(prevPublishedAgents.map((agent) => agent.id));

  // ---------- 확산: 에이전트 × 팀 실행 행렬 ----------
  const byAgentTeam = agentTeamMatrix(runs, publishedAgentIds);
  const prevByAgentTeam = agentTeamMatrix(prevRuns, prevPublishedAgentIds);
  const spread = spreadRows(byAgentTeam, agentById);
  const prevSpread = spreadRows(prevByAgentTeam, agentById);

  // ---------- 팀 리더보드 ----------
  const runsByTeam = countBy(runs, (r) => r.deptSnapshot);
  const prevRunsByTeam = countBy(prevRuns, (r) => r.deptSnapshot);
  const regsByTeam = countBy(newAgents, (a) => a.author.dept);

  const activeByTeam = new Map<string, Set<string>>();
  for (const a of activity) {
    const set = activeByTeam.get(a.deptSnapshot) ?? new Set<string>();
    set.add(a.userId);
    activeByTeam.set(a.deptSnapshot, set);
  }

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
  // 팀별 활성 인원을 더하지 않고 사용자 ID 집합을 부문별로 합쳐 중복을 제거한다.
  const activeIdsByDivision = new Map<string, Set<string>>();
  for (const run of runs) {
    const division = organization.teamDivisions.get(run.deptSnapshot);
    if (!division) continue;
    const ids = activeIdsByDivision.get(division) ?? new Set<string>();
    ids.add(run.userId);
    activeIdsByDivision.set(division, ids);
  }

  const divisionNames = new Set([...organization.divisionNames, ...Object.keys(headcounts)]);
  const divisionActivityRows: DivisionActivityRow[] = [...divisionNames]
    .map((division) => {
      const activeUsers = activeIdsByDivision.get(division)?.size ?? 0;
      const headcount = headcounts[division] ?? null;
      return {
        division,
        activeUsers,
        headcount,
        activeRate: rate(activeUsers, headcount),
      };
    })
    .sort((a, b) => {
      if (a.activeRate == null) return b.activeRate == null ? 0 : 1;
      if (b.activeRate == null) return -1;
      return b.activeRate - a.activeRate || b.activeUsers - a.activeUsers;
    });

  // 전사 평균도 총원이 등록된 부문의 사용자 ID를 다시 합쳐 계산한다.
  // 한 사용자가 여러 팀에서 실행했더라도 전사 분자에는 한 번만 들어간다.
  const companyActiveIds = new Set<string>();
  for (const row of divisionActivityRows) {
    if (row.headcount == null || row.headcount <= 0) continue;
    for (const userId of activeIdsByDivision.get(row.division) ?? []) {
      companyActiveIds.add(userId);
    }
  }
  const companyHeadcount = divisionActivityRows.reduce(
    (sum, row) => sum + (row.headcount ?? 0),
    0,
  );
  const divisionActivity = {
    rows: divisionActivityRows,
    averageRate: rate(companyActiveIds.size, companyHeadcount || null),
  };

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
    // [SQLITE] String 필드를 기존 TimeBand 허용값으로 좁혀 집계한다.
    const perRun = savedMinutes(parseTimeBand(agent.timeBefore), parseTimeBand(agent.timeAfter));
    if (!perRun) continue;
    savedMin += perRun * [...teams.values()].reduce((sum, n) => sum + n, 0);
  }

  // ---------- KPI ----------
  const totalRuns = runs.length;
  const spreadOutside = spread.filter((s) => s.outsidePct > 0).length;
  const prevSpreadOutside = prevSpread.filter((s) => s.outsidePct > 0).length;
  const spreadOutsideRate = agents.length ? spreadOutside / agents.length : 0;
  const prevSpreadOutsideRate = prevPublishedAgents.length
    ? prevSpreadOutside / prevPublishedAgents.length
    : 0;
  const avgTeams = averageTeams(spread);
  const prevAvgTeams = averageTeams(prevSpread);

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
      value: String(activity.length),
      unit: "명",
      delta: pctDelta(activity.length, prevActivity.length),
    },
    {
      key: "teams",
      label: "참여 부서",
      value: String(teams.length),
      unit: "곳",
      delta: pctDelta(teams.length, new Set(prevRuns.map((r) => r.deptSnapshot)).size),
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
      delta: pctDelta(spreadOutsideRate, prevSpreadOutsideRate),
      spread: true,
    },
    {
      key: "avgTeams",
      label: "에이전트당 평균 실행 팀",
      value: avgTeams.toFixed(1),
      unit: "팀",
      delta: pctDelta(avgTeams, prevAvgTeams),
      spread: true,
    },
  ];

  return {
    period,
    kpis,
    savedHours: Math.round(savedMin / 60),
    teams,
    divisionActivity,
    byCategory,
    spread,
  };
}
