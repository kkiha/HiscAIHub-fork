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
import { savedMinutes } from "./time-band";

// 기획서 8장 — 종합점수 가중치. 좋아요 제거 후 실행·등록 2축으로 재조정(2026-08-13 확정).
export const SCORE_WEIGHTS = { runs: 60, registrations: 40 } as const;

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

/** v/max를 가중치로 환산. max가 0이면 비교 대상이 없다는 뜻이므로 0점. */
function weighted(v: number, max: number, weight: number): number {
  return max > 0 ? (v / max) * weight : 0;
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
  score: number;
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

/** 팀 이름 → 소속 부문. 구독현황 스냅샷이 유일한 조직도 소스라 거기서 끌어온다. */
async function divisionLookup(): Promise<Map<string, string>> {
  const snapshot = await db.subscriptionSnapshot.findFirst({ orderBy: { period: "desc" } });
  if (!snapshot) return new Map();
  const rows = await db.subscriptionRow.findMany({
    where: { snapshotId: snapshot.id, scope: "team" },
    select: { name: true, division: true },
  });
  return new Map(rows.flatMap((r) => (r.division ? [[r.name, r.division] as const] : [])));
}

export async function getDashboardData(period: Period): Promise<DashboardData> {
  const since = daysAgo(period);
  const prevSince = daysAgo(period * 2);

  const [runs, prevRuns, agents, newAgents, prevNewAgents, activity, prevActivity, divisions] =
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
          author: { select: { id: true, name: true, dept: true } },
        },
      }),
      db.agent.findMany({
        where: { createdAt: { gte: since } },
        select: { category: true, author: { select: { id: true, name: true, dept: true } } },
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
      divisionLookup(),
    ]);

  const agentById = new Map(agents.map((a) => [a.id, a]));

  // ---------- 확산: 에이전트 × 팀 실행 행렬 ----------
  const byAgentTeam = new Map<string, Map<string, number>>();
  for (const log of runs) {
    if (!log.targetId || !agentById.has(log.targetId)) continue; // 삭제된 에이전트의 과거 로그
    const teams = byAgentTeam.get(log.targetId) ?? new Map<string, number>();
    teams.set(log.deptSnapshot, (teams.get(log.deptSnapshot) ?? 0) + 1);
    byAgentTeam.set(log.targetId, teams);
  }

  const spread: SpreadRow[] = [];
  for (const [agentId, teams] of byAgentTeam) {
    const agent = agentById.get(agentId)!;
    const ownerTeam = agent.author.dept;
    const entries = [...teams.entries()].sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, n]) => sum + n, 0);
    const own = teams.get(ownerTeam) ?? 0;
    spread.push({
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
  spread.sort((a, b) => b.total - a.total);

  // ---------- 팀 리더보드 ----------
  const runsByTeam = countBy(runs, (r) => r.deptSnapshot);
  const prevRunsByTeam = countBy(prevRuns, (r) => r.deptSnapshot);
  const regsByTeam = countBy(newAgents, (a) => a.author.dept);
  const prevRegsByTeam = countBy(prevNewAgents, (a) => a.author.dept);

  const activeByTeam = new Map<string, Set<string>>();
  for (const a of activity) {
    const set = activeByTeam.get(a.deptSnapshot) ?? new Set<string>();
    set.add(a.userId);
    activeByTeam.set(a.deptSnapshot, set);
  }

  const teamNames = new Set([...runsByTeam.keys(), ...regsByTeam.keys(), ...activeByTeam.keys()]);
  const maxTeamRuns = Math.max(0, ...runsByTeam.values());
  const maxTeamRegs = Math.max(0, ...regsByTeam.values());
  const maxPrevTeamRuns = Math.max(0, ...prevRunsByTeam.values());
  const maxPrevTeamRegs = Math.max(0, ...prevRegsByTeam.values());

  const teams: TeamRow[] = [...teamNames]
    .map((team) => {
      const teamRuns = runsByTeam.get(team) ?? 0;
      const teamRegs = regsByTeam.get(team) ?? 0;
      const users = activeByTeam.get(team)?.size ?? 0;
      const score = Math.round(
        weighted(teamRuns, maxTeamRuns, SCORE_WEIGHTS.runs) +
          weighted(teamRegs, maxTeamRegs, SCORE_WEIGHTS.registrations),
      );
      const prevScore = Math.round(
        weighted(prevRunsByTeam.get(team) ?? 0, maxPrevTeamRuns, SCORE_WEIGHTS.runs) +
          weighted(prevRegsByTeam.get(team) ?? 0, maxPrevTeamRegs, SCORE_WEIGHTS.registrations),
      );
      return {
        team,
        division: divisions.get(team) ?? null,
        runs: teamRuns,
        registrations: teamRegs,
        activeUsers: users,
        avgRunsPerUser: users ? Math.round((teamRuns / users) * 10) / 10 : 0,
        score,
        delta: pctDelta(score, prevScore),
      };
    })
    .sort((a, b) => b.score - a.score);

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
        score: Math.round(
          weighted(userRuns, maxUserRuns, SCORE_WEIGHTS.runs) +
            weighted(userRegs, maxUserRegs, SCORE_WEIGHTS.registrations),
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
  const registeredCategories = new Set(agents.map((a) => a.category)).size;
  const ranCategories = [...runsByCategory.values()].filter((n) => n > 0).length;
  const totalCategories = categoryNames.length;
  const spreadOutside = spread.filter((s) => s.outsidePct > 0).length;
  const avgTeamsPerAgent = spread.length
    ? Math.round((spread.reduce((sum, s) => sum + s.teams, 0) / spread.length) * 10) / 10
    : 0;

  const kpis: KpiCard[] = [
    {
      key: "registrations",
      label: "에이전트 등록",
      value: String(newAgents.length),
      unit: "건",
      delta: pctDelta(newAgents.length, prevNewAgents.length),
    },
    {
      key: "teams",
      label: "참여 부서",
      value: String(teams.length),
      unit: "곳",
      delta: pctDelta(teams.length, new Set(prevRuns.map((r) => r.deptSnapshot)).size),
    },
    {
      key: "activeUsers",
      label: "활성 유저",
      value: String(activity.length),
      unit: "명",
      delta: pctDelta(activity.length, prevActivity.length),
    },
    {
      key: "runs",
      label: "에이전트 실행",
      value: String(totalRuns),
      unit: "회",
      delta: pctDelta(totalRuns, prevRuns.length),
    },
    {
      key: "registeredCategories",
      label: "등록 카테고리",
      value: String(registeredCategories),
      unit: `/ ${totalCategories}`,
      delta: null,
    },
    {
      key: "ranCategories",
      label: "실행 카테고리",
      value: String(ranCategories),
      unit: `/ ${totalCategories}`,
      delta: null,
    },
    {
      key: "spreadOutside",
      label: "타팀까지 퍼진 에이전트",
      value: String(spreadOutside),
      unit: `/ ${spread.length}건`,
      delta: null,
      spread: true,
    },
    {
      key: "avgTeams",
      label: "에이전트당 평균 실행 팀",
      value: avgTeamsPerAgent.toFixed(1),
      unit: "팀",
      delta: null,
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
  };
}
