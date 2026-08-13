// 관리자 콘솔 데이터 계층 — DB ↔ 관리자 콘솔 DTO 변환.
import { db } from "./db";
import { WORK_CATEGORIES } from "./work-categories";

function fmtDateTime(d: Date): string {
  const dt = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const tm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${dt} ${tm}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const RUN_ACTIONS = ["prompt_run", "agent_run"] as const;

export type ContentKind = "prompt" | "agent";
type DateRange = { gte: Date; lt?: Date };
type CollectedContent = {
  id: string;
  kind: ContentKind;
  title: string;
  category: string;
  authorId: string;
  authorName: string;
  authorDept: string;
  createdAt: Date;
  runCount: number;
  status: "published" | "hidden" | "flagged";
  official: boolean;
};

async function collectContents(createdAt?: DateRange): Promise<CollectedContent[]> {
  const where = createdAt ? { createdAt } : {};
  // 프롬프트 제거 시 이 블록에서 Prompt 관련 조회만 삭제하면 된다.
  const [prompts, agents] = await Promise.all([
    db.prompt.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        authorId: true,
        createdAt: true,
        runCount: true,
        status: true,
        official: true,
        author: { select: { name: true, dept: true } },
      },
    }),
    db.agent.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        authorId: true,
        createdAt: true,
        runCount: true,
        status: true,
        official: true,
        author: { select: { name: true, dept: true } },
      },
    }),
  ]);

  return [
    ...prompts.map((prompt) => ({
      id: prompt.id,
      kind: "prompt" as const,
      title: prompt.title,
      category: prompt.category,
      authorId: prompt.authorId,
      authorName: prompt.author.name,
      authorDept: prompt.author.dept,
      createdAt: prompt.createdAt,
      runCount: prompt.runCount,
      status: prompt.status,
      official: prompt.official,
    })),
    ...agents.map((agent) => ({
      id: agent.id,
      kind: "agent" as const,
      title: agent.name,
      category: agent.category,
      authorId: agent.authorId,
      authorName: agent.author.name,
      authorDept: agent.author.dept,
      createdAt: agent.createdAt,
      runCount: agent.runCount,
      status: agent.status,
      official: agent.official,
    })),
  ];
}

async function collectRunLogs(gte: Date, lt?: Date) {
  const createdAt = lt ? { gte, lt } : { gte };
  return db.auditLog.findMany({
    where: { createdAt, action: { in: [...RUN_ACTIONS] } },
    select: {
      userId: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      user: { select: { name: true, dept: true } },
    },
  });
}

function contentKey(kind: ContentKind, id: string): string {
  return `${kind}:${id}`;
}

function indexContents(contents: CollectedContent[]): Map<string, CollectedContent> {
  return new Map(contents.map((content) => [contentKey(content.kind, content.id), content]));
}

function findRunContent(
  log: { targetType: string | null; targetId: string | null },
  contentsByKey: Map<string, CollectedContent>,
): CollectedContent | null {
  if ((log.targetType !== "prompt" && log.targetType !== "agent") || !log.targetId) return null;
  return contentsByKey.get(contentKey(log.targetType, log.targetId)) ?? null;
}

// ---------- 대시보드 ----------
export async function getDashboardStats(days: number) {
  const periodStart = daysAgo(days);
  const previousPeriodStart = daysAgo(days * 2);

  const [activeUsersInPeriod, activeUsersInPreviousPeriod, contents, callsInPeriod, callsInPreviousPeriod, costAgg] =
    await Promise.all([
      db.auditLog.findMany({ where: { createdAt: { gte: periodStart }, action: { in: [...RUN_ACTIONS] } }, distinct: ["userId"], select: { userId: true } }),
      db.auditLog.findMany({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart }, action: { in: [...RUN_ACTIONS] } }, distinct: ["userId"], select: { userId: true } }),
      collectContents(),
      db.usageLog.count({ where: { createdAt: { gte: periodStart } } }),
      db.usageLog.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),
      db.usageLog.aggregate({ where: { createdAt: { gte: periodStart } }, _sum: { costUsd: true } }),
    ]);

  const newContentInPeriod = contents.filter((content) => content.createdAt >= periodStart);
  const newPrompts = newContentInPeriod.filter((content) => content.kind === "prompt").length;
  const newAgents = newContentInPeriod.filter((content) => content.kind === "agent").length;

  const pendingReports = await db.report.findMany({
    where: { status: "pending" },
    include: { prompt: true, agent: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const topContent = contents
    .map((content) => ({
      type: content.kind === "prompt" ? ("프롬프트" as const) : ("에이전트" as const),
      title: content.title,
      runs: content.runCount,
    }))
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

  const activeUsersDelta = activeUsersInPreviousPeriod.length
    ? Math.round(((activeUsersInPeriod.length - activeUsersInPreviousPeriod.length) / activeUsersInPreviousPeriod.length) * 100)
    : null;
  const callsDelta = callsInPreviousPeriod ? Math.round(((callsInPeriod - callsInPreviousPeriod) / callsInPreviousPeriod) * 100) : null;

  return {
    periodDays: days,
    activeUsers: activeUsersInPeriod.length,
    activeUsersDelta,
    newContent: { prompts: newPrompts, agents: newAgents, total: newPrompts + newAgents },
    callsInPeriod,
    callsDelta,
    costInPeriodUsd: costAgg._sum.costUsd ?? 0,
    pendingReports: pendingReports.map((r) => ({
      id: r.id,
      type: r.promptId ? ("프롬프트" as const) : ("에이전트" as const),
      title: r.prompt?.title ?? r.agent?.name ?? "",
      reason: r.reason,
    })),
    pendingReportCount: await db.report.count({ where: { status: "pending" } }),
    topContent,
  };
}

// ---------- 콘텐츠 관리 ----------
export type ContentRow = {
  id: string;
  type: "프롬프트" | "에이전트";
  title: string;
  author: string;
  dept: string;
  metric: string;
  status: "pub" | "hidden" | "flag";
  official: boolean;
};

const STATUS_MAP = { published: "pub", hidden: "hidden", flagged: "flag" } as const;

export async function listContent(): Promise<ContentRow[]> {
  const contents = await collectContents();
  return contents
    .map((content): ContentRow => ({
      id: content.id,
      type: content.kind === "prompt" ? "프롬프트" : "에이전트",
      title: content.title,
      author: content.authorName,
      dept: content.authorDept,
      metric: `실행 ${content.runCount}`,
      status: STATUS_MAP[content.status],
      official: content.official,
    }))
    .sort((a, b) => (a.title < b.title ? -1 : 1));
}

export async function toggleContentOfficial(type: "prompt" | "agent", id: string): Promise<boolean> {
  if (type === "prompt") {
    const p = await db.prompt.findUniqueOrThrow({ where: { id } });
    const updated = await db.prompt.update({ where: { id }, data: { official: !p.official } });
    return updated.official;
  }
  const a = await db.agent.findUniqueOrThrow({ where: { id } });
  const updated = await db.agent.update({ where: { id }, data: { official: !a.official } });
  return updated.official;
}

export async function toggleContentHidden(type: "prompt" | "agent", id: string): Promise<"pub" | "hidden"> {
  if (type === "prompt") {
    const p = await db.prompt.findUniqueOrThrow({ where: { id } });
    const next = p.status === "hidden" ? "published" : "hidden";
    await db.prompt.update({ where: { id }, data: { status: next } });
    return STATUS_MAP[next] as "pub" | "hidden";
  }
  const a = await db.agent.findUniqueOrThrow({ where: { id } });
  const next = a.status === "hidden" ? "published" : "hidden";
  await db.agent.update({ where: { id }, data: { status: next } });
  return STATUS_MAP[next] as "pub" | "hidden";
}

export async function deleteContent(type: "prompt" | "agent", id: string): Promise<void> {
  if (type === "prompt") await db.prompt.delete({ where: { id } });
  else await db.agent.delete({ where: { id } });
}

// ---------- 신고 처리 ----------
export async function listPendingReports() {
  const reports = await db.report.findMany({
    where: { status: "pending" },
    include: { prompt: true, agent: true },
    orderBy: { createdAt: "asc" },
  });
  return reports.map((r) => ({
    id: r.id,
    type: r.promptId ? ("프롬프트" as const) : ("에이전트" as const),
    contentType: r.promptId ? ("prompt" as const) : ("agent" as const),
    contentId: (r.promptId ?? r.agentId) as string,
    title: r.prompt?.title ?? r.agent?.name ?? "(삭제된 콘텐츠)",
    reason: r.reason,
    reporterCount: 1,
    date: fmtDateTime(r.createdAt),
  }));
}

export async function resolveReport(reportId: string, action: "keep" | "hide" | "delete"): Promise<void> {
  const report = await db.report.findUniqueOrThrow({ where: { id: reportId } });

  if (action === "delete") {
    if (report.promptId) await db.prompt.delete({ where: { id: report.promptId } });
    else if (report.agentId) await db.agent.delete({ where: { id: report.agentId } });
    // Report는 콘텐츠 삭제 시 cascade로 함께 삭제됨
    return;
  }

  if (action === "hide") {
    if (report.promptId) await db.prompt.update({ where: { id: report.promptId }, data: { status: "hidden" } });
    else if (report.agentId) await db.agent.update({ where: { id: report.agentId }, data: { status: "hidden" } });
  }

  await db.report.update({ where: { id: reportId }, data: { status: "resolved", action, resolvedAt: new Date() } });
}

// ---------- 사용자·권한 ----------
export async function listUsersAdmin() {
  const [users, contents] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    collectContents(),
  ]);
  const postsByAuthor = new Map<string, number>();
  for (const content of contents) {
    postsByAuthor.set(content.authorId, (postsByAuthor.get(content.authorId) ?? 0) + 1);
  }
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    dept: u.dept,
    email: u.email,
    posts: postsByAuthor.get(u.id) ?? 0,
    last: u.lastActiveAt ? fmtDateTime(u.lastActiveAt) : "-",
    role: u.role,
  }));
}

export async function updateUserRole(userId: string, role: "admin" | "mod" | "user"): Promise<string> {
  const updated = await db.user.update({ where: { id: userId }, data: { role } });
  return updated.name;
}

// ---------- 사용량·비용 ----------
export async function getUsageStats() {
  const since = daysAgo(6);
  since.setHours(0, 0, 0, 0);

  const logs = await db.usageLog.findMany({
    where: { createdAt: { gte: since } },
    include: { user: true },
  });

  const byDay = new Map<string, { count: number; cost: number }>();
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toDateString(), { count: 0, cost: 0 });
  }
  for (const log of logs) {
    const key = log.createdAt.toDateString();
    const entry = byDay.get(key);
    if (entry) {
      entry.count += 1;
      entry.cost += log.costUsd;
    }
  }
  const daily = Array.from(byDay.entries()).map(([dateStr, v]) => ({
    label: dayLabels[new Date(dateStr).getDay()],
    count: v.count,
    cost: Math.round(v.cost * 100) / 100,
  }));

  const byFeature = new Map<string, { count: number; cost: number }>();
  for (const log of logs) {
    const entry = byFeature.get(log.feature) ?? { count: 0, cost: 0 };
    entry.count += 1;
    entry.cost += log.costUsd;
    byFeature.set(log.feature, entry);
  }
  const FEATURE_LABEL: Record<string, string> = {
    prompt_generate: "프롬프트 만들기",
    agent_generate: "에이전트 만들기",
    agent_run: "에이전트 실행",
  };
  const featureBreakdown = Array.from(byFeature.entries()).map(([feature, v]) => ({
    feature,
    label: FEATURE_LABEL[feature] ?? feature,
    count: v.count,
    cost: Math.round(v.cost * 100) / 100,
  }));

  const byUser = new Map<string, { name: string; dept: string; count: number }>();
  for (const log of logs) {
    const entry = byUser.get(log.userId) ?? { name: log.user.name, dept: log.user.dept, count: 0 };
    entry.count += 1;
    byUser.set(log.userId, entry);
  }
  const topUsers = Array.from(byUser.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const totalCalls = logs.length;
  const totalCost = Math.round(logs.reduce((sum, l) => sum + l.costUsd, 0) * 100) / 100;

  const setting = await db.setting.findUnique({ where: { key: "per_user_daily_call_limit" } });
  const perUserLimit = typeof setting?.value === "number" ? setting.value : 100;

  return { daily, featureBreakdown, topUsers, totalCalls, totalCost, perUserLimit };
}

export async function setPerUserDailyLimit(limit: number): Promise<void> {
  await db.setting.upsert({
    where: { key: "per_user_daily_call_limit" },
    update: { value: limit },
    create: { key: "per_user_daily_call_limit", value: limit },
  });
}

// ---------- 부서·임직원 활용도 리더보드 ----------
// "실행 횟수" = 프롬프트/에이전트의 "Claude로 실행" 버튼 클릭(AuditLog의 prompt_run/agent_run).
// 실제로 Claude에서 끝까지 작업했는지는 알 수 없지만(실행은 claude.ai 딥링크로 각자 PC에서
// 이뤄져 백엔드가 결과를 알 수 없음), 서비스가 관측 가능한 지표 중 "Claude 사용 시도"를
// 가장 직접적으로 보여주는 신호라 이걸 채택한다. UsageLog(백엔드 생성 호출·비용)와는 별개 —
// 그건 사용량·비용 탭에서 그대로 확인 가능.
// 종합점수 가중치: 실행에 가장 큰 비중을 둔다.
const SCORE_WEIGHTS = { runs: 60, registrations: 40 };

type PeriodTotals = {
  byDept: Map<string, { runs: number; registrations: number; activeUsers: Set<string> }>;
  byUser: Map<string, { name: string; dept: string; runs: number; registrations: number }>;
};

function ensureDept(m: PeriodTotals["byDept"], dept: string) {
  if (!m.has(dept)) m.set(dept, { runs: 0, registrations: 0, activeUsers: new Set() });
  return m.get(dept)!;
}
function ensureUser(m: PeriodTotals["byUser"], id: string, name: string, dept: string) {
  if (!m.has(id)) m.set(id, { name, dept, runs: 0, registrations: 0 });
  return m.get(id)!;
}

async function collectPeriodTotals(gte: Date, lt?: Date): Promise<PeriodTotals> {
  const range = lt ? { gte, lt } : { gte };
  const [runLogs, contents] = await Promise.all([
    collectRunLogs(gte, lt),
    collectContents(range),
  ]);

  const byDept: PeriodTotals["byDept"] = new Map();
  const byUser: PeriodTotals["byUser"] = new Map();

  for (const log of runLogs) {
    ensureDept(byDept, log.user.dept).runs += 1;
    ensureDept(byDept, log.user.dept).activeUsers.add(log.userId);
    ensureUser(byUser, log.userId, log.user.name, log.user.dept).runs += 1;
  }
  for (const content of contents) {
    ensureDept(byDept, content.authorDept).registrations += 1;
    ensureUser(byUser, content.authorId, content.authorName, content.authorDept).registrations += 1;
  }
  return { byDept, byUser };
}

function scoreOf(
  row: { runs: number; registrations: number },
  max: { runs: number; registrations: number },
): number {
  const part = (v: number, m: number, w: number) => (m > 0 ? (v / m) * w : 0);
  return Math.round(part(row.runs, max.runs, SCORE_WEIGHTS.runs) + part(row.registrations, max.registrations, SCORE_WEIGHTS.registrations));
}

export type DeptLeaderboardRow = {
  dept: string;
  runs: number;
  registrations: number;
  activeUsers: number;
  avgRunsPerUser: number;
  score: number;
  delta: number | null;
};

export type PersonLeaderboardRow = {
  id: string;
  name: string;
  dept: string;
  runs: number;
  registrations: number;
  score: number;
  badges: ("runs" | "registrations")[];
  lastActive: string;
};

export async function getLeaderboardStats(days: number): Promise<{
  depts: DeptLeaderboardRow[];
  individuals: PersonLeaderboardRow[];
  powerUser: PersonLeaderboardRow | null;
}> {
  const since = daysAgo(days);
  const prevSince = daysAgo(days * 2);

  const [current, previous, lastActiveById] = await Promise.all([
    collectPeriodTotals(since),
    collectPeriodTotals(prevSince, since),
    db.user.findMany({ select: { id: true, lastActiveAt: true } }).then((rows) => new Map(rows.map((r) => [r.id, r.lastActiveAt]))),
  ]);

  const deptMax = { runs: 0, registrations: 0 };
  for (const v of current.byDept.values()) {
    deptMax.runs = Math.max(deptMax.runs, v.runs);
    deptMax.registrations = Math.max(deptMax.registrations, v.registrations);
  }
  const prevDeptMax = { runs: 0, registrations: 0 };
  for (const v of previous.byDept.values()) {
    prevDeptMax.runs = Math.max(prevDeptMax.runs, v.runs);
    prevDeptMax.registrations = Math.max(prevDeptMax.registrations, v.registrations);
  }

  const depts: DeptLeaderboardRow[] = Array.from(current.byDept.entries())
    .map(([dept, v]) => {
      const score = scoreOf(v, deptMax);
      const prev = previous.byDept.get(dept);
      const prevScore = prev ? scoreOf(prev, prevDeptMax) : 0;
      const delta = prevScore > 0 ? Math.round(((score - prevScore) / prevScore) * 100) : null;
      return {
        dept,
        runs: v.runs,
        registrations: v.registrations,
        activeUsers: v.activeUsers.size,
        avgRunsPerUser: v.activeUsers.size ? Math.round((v.runs / v.activeUsers.size) * 10) / 10 : 0,
        score,
        delta,
      };
    })
    .sort((a, b) => b.score - a.score);

  const userMax = { runs: 0, registrations: 0 };
  for (const v of current.byUser.values()) {
    userMax.runs = Math.max(userMax.runs, v.runs);
    userMax.registrations = Math.max(userMax.registrations, v.registrations);
  }

  const individuals: PersonLeaderboardRow[] = Array.from(current.byUser.entries())
    .map(([id, v]) => {
      const badges: PersonLeaderboardRow["badges"] = [];
      if (userMax.runs > 0 && v.runs === userMax.runs) badges.push("runs");
      if (userMax.registrations > 0 && v.registrations === userMax.registrations) badges.push("registrations");
      const lastActiveAt = lastActiveById.get(id) ?? null;
      return {
        id,
        name: v.name,
        dept: v.dept,
        runs: v.runs,
        registrations: v.registrations,
        score: scoreOf(v, userMax),
        badges,
        lastActive: lastActiveAt ? fmtDateTime(lastActiveAt) : "-",
      };
    })
    .sort((a, b) => b.score - a.score);

  return { depts, individuals, powerUser: individuals[0] ?? null };
}

// ---------- 대시보드 확장 지표 ----------
const DEPT_HEADCOUNT_SETTING_KEY = "dept_headcount";
const SMALL_DEPT_THRESHOLD = 10;

function requirePositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label}은 1 이상의 정수여야 합니다.`);
  }
}

function normalizeDeptFilter(dept?: string): string | null {
  return dept?.trim() || null;
}

function roundPercent(numerator: number, denominator: number): number {
  return Math.round((numerator / denominator) * 1000) / 10;
}

export type DeptHeadcounts = Record<string, number>;

function parseDeptHeadcounts(value: unknown): DeptHeadcounts {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const parsed: DeptHeadcounts = {};
  for (const [rawDept, rawHeadcount] of Object.entries(value)) {
    const dept = rawDept.trim();
    if (dept && typeof rawHeadcount === "number" && Number.isInteger(rawHeadcount) && rawHeadcount > 0) {
      parsed[dept] = rawHeadcount;
    }
  }
  return parsed;
}

export async function getDeptHeadcounts(): Promise<DeptHeadcounts> {
  const setting = await db.setting.findUnique({ where: { key: DEPT_HEADCOUNT_SETTING_KEY } });
  return parseDeptHeadcounts(setting?.value);
}

export async function saveDeptHeadcounts(headcounts: DeptHeadcounts): Promise<void> {
  const normalized: DeptHeadcounts = {};
  for (const [rawDept, headcount] of Object.entries(headcounts)) {
    const dept = rawDept.trim();
    if (!dept || !Number.isInteger(headcount) || headcount < 1) {
      throw new RangeError("부서명과 1명 이상의 인원수를 입력해야 합니다.");
    }
    normalized[dept] = headcount;
  }

  await db.setting.upsert({
    where: { key: DEPT_HEADCOUNT_SETTING_KEY },
    update: { value: normalized },
    create: { key: DEPT_HEADCOUNT_SETTING_KEY, value: normalized },
  });
}

export type DeptUsageRow = {
  dept: string;
  headcount: number | null;
  runs: number;
  registrations: number;
  activeUsers: number;
  activeUserRate: number | null;
  grouped: boolean;
};

export type DeptUsageStats = {
  periodDays: number;
  filterDept: string | null;
  totals: Omit<DeptUsageRow, "dept" | "grouped">;
  departments: DeptUsageRow[];
};

export async function getDeptUsageStats(days: number, dept?: string): Promise<DeptUsageStats> {
  requirePositiveInteger(days, "집계 기간");
  const filterDept = normalizeDeptFilter(dept);
  const [period, headcounts] = await Promise.all([
    collectPeriodTotals(daysAgo(days)),
    getDeptHeadcounts(),
  ]);

  const deptNames = filterDept
    ? new Set([filterDept])
    : new Set([...period.byDept.keys(), ...Object.keys(headcounts)]);
  const rawRows = Array.from(deptNames, (deptName): DeptUsageRow => {
    const totals = period.byDept.get(deptName);
    const headcount = headcounts[deptName] ?? null;
    const activeUsers = totals?.activeUsers.size ?? 0;
    return {
      dept: deptName,
      headcount,
      runs: totals?.runs ?? 0,
      registrations: totals?.registrations ?? 0,
      activeUsers,
      // 인원수 미등록 부서는 0%가 아니라 null로 반환해 화면에서 미표시할 수 있게 한다.
      activeUserRate: headcount === null ? null : roundPercent(activeUsers, headcount),
      grouped: false,
    };
  });

  const totalHeadcount = rawRows.length > 0 && rawRows.every((row) => row.headcount !== null)
    ? rawRows.reduce((sum, row) => sum + (row.headcount ?? 0), 0)
    : null;
  const totalActiveUsers = rawRows.reduce((sum, row) => sum + row.activeUsers, 0);
  const totals: DeptUsageStats["totals"] = {
    headcount: totalHeadcount,
    runs: rawRows.reduce((sum, row) => sum + row.runs, 0),
    registrations: rawRows.reduce((sum, row) => sum + row.registrations, 0),
    activeUsers: totalActiveUsers,
    activeUserRate: totalHeadcount === null ? null : roundPercent(totalActiveUsers, totalHeadcount),
  };

  if (filterDept) {
    return { periodDays: days, filterDept, totals, departments: rawRows };
  }

  const smallRows = rawRows.filter((row) => row.headcount !== null && row.headcount < SMALL_DEPT_THRESHOLD);
  const departments = rawRows
    .filter((row) => row.headcount === null || row.headcount >= SMALL_DEPT_THRESHOLD)
    .sort((a, b) => b.runs - a.runs || a.dept.localeCompare(b.dept, "ko"));

  if (smallRows.length > 0) {
    const smallHeadcount = smallRows.reduce((sum, row) => sum + (row.headcount ?? 0), 0);
    const smallActiveUsers = smallRows.reduce((sum, row) => sum + row.activeUsers, 0);
    departments.push({
      dept: "기타",
      headcount: smallHeadcount,
      runs: smallRows.reduce((sum, row) => sum + row.runs, 0),
      registrations: smallRows.reduce((sum, row) => sum + row.registrations, 0),
      activeUsers: smallActiveUsers,
      activeUserRate: roundPercent(smallActiveUsers, smallHeadcount),
      grouped: true,
    });
  }

  return { periodDays: days, filterDept, totals, departments };
}

export type CategoryStatsRow = {
  category: string;
  registrations: number;
  adoptions: number;
  uniqueUsers: number;
};

export async function getCategoryStats(days: number, dept?: string): Promise<CategoryStatsRow[]> {
  requirePositiveInteger(days, "집계 기간");
  const since = daysAgo(days);
  const filterDept = normalizeDeptFilter(dept);
  const [contents, runLogs] = await Promise.all([
    collectContents(),
    collectRunLogs(since),
  ]);
  const contentsByKey = indexContents(contents);
  const stats = new Map<string, { registrations: number; adoptions: number; users: Set<string> }>();

  const ensureCategory = (category: string) => {
    if (!stats.has(category)) stats.set(category, { registrations: 0, adoptions: 0, users: new Set() });
    return stats.get(category)!;
  };
  for (const category of WORK_CATEGORIES) ensureCategory(category);

  for (const content of contents) {
    if (content.createdAt >= since && (!filterDept || content.authorDept === filterDept)) {
      ensureCategory(content.category).registrations += 1;
    }
  }

  for (const log of runLogs) {
    if (filterDept && log.user.dept !== filterDept) continue;
    const content = findRunContent(log, contentsByKey);
    if (!content) continue;
    const category = ensureCategory(content.category);
    category.adoptions += 1;
    category.users.add(log.userId);
  }

  const categoryOrder = new Map(WORK_CATEGORIES.map((category, index) => [category, index]));
  return Array.from(stats.entries())
    .map(([category, value]) => ({
      category,
      registrations: value.registrations,
      adoptions: value.adoptions,
      uniqueUsers: value.users.size,
    }))
    .sort((a, b) => (categoryOrder.get(a.category) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(b.category) ?? Number.MAX_SAFE_INTEGER));
}

export type ContentDiffusionRow = {
  contentId: string;
  contentType: ContentKind;
  title: string;
  category: string;
  ownerDept: string;
  executionDeptCount: number;
  crossDeptRuns: number;
};

export type DeptDiffusionRow = {
  dept: string;
  externalConsumerDeptCount: number;
  importedRuns: number;
};

export type DiffusionStats = {
  periodDays: number;
  filterDept: string | null;
  contents: ContentDiffusionRow[];
  departments: DeptDiffusionRow[];
};

export async function getDiffusionStats(days: number, dept?: string): Promise<DiffusionStats> {
  requirePositiveInteger(days, "집계 기간");
  const filterDept = normalizeDeptFilter(dept);
  const [contents, runLogs] = await Promise.all([
    collectContents(),
    collectRunLogs(daysAgo(days)),
  ]);
  const contentsByKey = indexContents(contents);
  const contentStats = new Map<string, { executionDepts: Set<string>; crossDeptRuns: number }>();
  const deptStats = new Map<string, { externalConsumerDepts: Set<string>; importedRuns: number }>();

  const ensureContent = (content: CollectedContent) => {
    const key = contentKey(content.kind, content.id);
    if (!contentStats.has(key)) contentStats.set(key, { executionDepts: new Set(), crossDeptRuns: 0 });
    return contentStats.get(key)!;
  };
  const ensureDeptDiffusion = (deptName: string) => {
    if (!deptStats.has(deptName)) deptStats.set(deptName, { externalConsumerDepts: new Set(), importedRuns: 0 });
    return deptStats.get(deptName)!;
  };

  for (const content of contents) {
    ensureContent(content);
    ensureDeptDiffusion(content.authorDept);
  }

  for (const log of runLogs) {
    const content = findRunContent(log, contentsByKey);
    if (!content) continue;
    const executorDept = log.user.dept;
    ensureContent(content).executionDepts.add(executorDept);
    ensureDeptDiffusion(executorDept);
    if (executorDept !== content.authorDept) {
      ensureContent(content).crossDeptRuns += 1;
      ensureDeptDiffusion(content.authorDept).externalConsumerDepts.add(executorDept);
      ensureDeptDiffusion(executorDept).importedRuns += 1;
    }
  }

  const contentRows = contents
    .filter((content) => !filterDept || content.authorDept === filterDept)
    .map((content): ContentDiffusionRow => {
      const value = ensureContent(content);
      return {
        contentId: content.id,
        contentType: content.kind,
        title: content.title,
        category: content.category,
        ownerDept: content.authorDept,
        executionDeptCount: value.executionDepts.size,
        crossDeptRuns: value.crossDeptRuns,
      };
    })
    .sort((a, b) => b.crossDeptRuns - a.crossDeptRuns || b.executionDeptCount - a.executionDeptCount);

  const departmentRows = Array.from(deptStats.entries())
    .filter(([deptName]) => !filterDept || deptName === filterDept)
    .map(([deptName, value]): DeptDiffusionRow => ({
      dept: deptName,
      externalConsumerDeptCount: value.externalConsumerDepts.size,
      importedRuns: value.importedRuns,
    }))
    .sort((a, b) => b.importedRuns - a.importedRuns || b.externalConsumerDeptCount - a.externalConsumerDeptCount);

  return { periodDays: days, filterDept, contents: contentRows, departments: departmentRows };
}

export type MonthlyTrendRow = {
  month: string;
  label: string;
  newRegistrations: number;
  adoptions: number;
  activeUsers: number;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyTrend(months: number, dept?: string): Promise<MonthlyTrendRow[]> {
  requirePositiveInteger(months, "집계 개월 수");
  const filterDept = normalizeDeptFilter(dept);
  const now = new Date();
  const bucketStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const [contents, runLogs] = await Promise.all([
    collectContents(),
    collectRunLogs(bucketStart),
  ]);
  const contentsByKey = indexContents(contents);
  const buckets = new Map<string, { label: string; newRegistrations: number; adoptions: number; users: Set<string> }>();

  for (let offset = 0; offset < months; offset += 1) {
    const date = new Date(bucketStart.getFullYear(), bucketStart.getMonth() + offset, 1);
    buckets.set(monthKey(date), {
      label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
      newRegistrations: 0,
      adoptions: 0,
      users: new Set(),
    });
  }

  for (const content of contents) {
    if (content.createdAt < bucketStart || (filterDept && content.authorDept !== filterDept)) continue;
    const bucket = buckets.get(monthKey(content.createdAt));
    if (bucket) bucket.newRegistrations += 1;
  }

  for (const log of runLogs) {
    if (filterDept && log.user.dept !== filterDept) continue;
    if (!findRunContent(log, contentsByKey)) continue;
    const bucket = buckets.get(monthKey(log.createdAt));
    if (!bucket) continue;
    bucket.adoptions += 1;
    bucket.users.add(log.userId);
  }

  return Array.from(buckets.entries()).map(([month, value]) => ({
    month,
    label: value.label,
    newRegistrations: value.newRegistrations,
    adoptions: value.adoptions,
    activeUsers: value.users.size,
  }));
}

export type PopularContentRow = {
  contentId: string;
  contentType: ContentKind;
  title: string;
  category: string;
  runs: number;
};

export async function getPopularContentStats(days: number, dept?: string, limit = 5): Promise<PopularContentRow[]> {
  requirePositiveInteger(days, "집계 기간");
  requirePositiveInteger(limit, "인기 콘텐츠 개수");
  const filterDept = normalizeDeptFilter(dept);
  const [contents, runLogs] = await Promise.all([
    collectContents(),
    collectRunLogs(daysAgo(days)),
  ]);
  const contentsByKey = indexContents(contents);
  const runsByContent = new Map<string, number>();

  for (const log of runLogs) {
    if (filterDept && log.user.dept !== filterDept) continue;
    const content = findRunContent(log, contentsByKey);
    if (!content) continue;
    const key = contentKey(content.kind, content.id);
    runsByContent.set(key, (runsByContent.get(key) ?? 0) + 1);
  }

  return contents
    .map((content): PopularContentRow => ({
      contentId: content.id,
      contentType: content.kind,
      title: content.title,
      category: content.category,
      runs: runsByContent.get(contentKey(content.kind, content.id)) ?? 0,
    }))
    .filter((content) => content.runs > 0)
    .sort((a, b) => b.runs - a.runs || a.title.localeCompare(b.title, "ko"))
    .slice(0, limit);
}

export async function getDashboardDepartments(): Promise<string[]> {
  const [users, headcounts] = await Promise.all([
    db.user.findMany({ distinct: ["dept"], select: { dept: true } }),
    getDeptHeadcounts(),
  ]);
  return Array.from(new Set([...users.map((user) => user.dept), ...Object.keys(headcounts)]))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ko"));
}

export type AiSubscriptionRow = {
  dept: string;
  tool: string;
  accounts: number;
  monthlyCostKrw: number;
};

export type AiSubscriptionStats = {
  referenceMonth: string | null;
  rows: AiSubscriptionRow[];
};

export async function getAiSubscriptionStats(dept?: string): Promise<AiSubscriptionStats> {
  const filterDept = normalizeDeptFilter(dept);
  const [monthSetting, rowsSetting] = await Promise.all([
    db.setting.findUnique({ where: { key: "ai_subscription_reference_month" } }),
    db.setting.findUnique({ where: { key: "ai_subscription_by_dept" } }),
  ]);
  const referenceMonth = typeof monthSetting?.value === "string" ? monthSetting.value : null;
  const rawRows: unknown[] = Array.isArray(rowsSetting?.value) ? rowsSetting.value : [];
  const rows = rawRows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    .map((row): AiSubscriptionRow | null => {
      const rowDept = typeof row.dept === "string" ? row.dept.trim() : "";
      const tool = typeof row.tool === "string" ? row.tool.trim() : "";
      const accounts = typeof row.accounts === "number" && Number.isInteger(row.accounts) && row.accounts >= 0 ? row.accounts : null;
      const monthlyCostKrw = typeof row.monthlyCostKrw === "number" && row.monthlyCostKrw >= 0 ? row.monthlyCostKrw : null;
      return rowDept && tool && accounts !== null && monthlyCostKrw !== null
        ? { dept: rowDept, tool, accounts, monthlyCostKrw }
        : null;
    })
    .filter((row): row is AiSubscriptionRow => row !== null)
    .filter((row) => !filterDept || row.dept === filterDept)
    .sort((a, b) => a.dept.localeCompare(b.dept, "ko") || a.tool.localeCompare(b.tool, "ko"));

  return { referenceMonth, rows };
}

// ---------- 감사 로그 ----------
const AUDIT_ACTION_LABEL: Record<string, string> = {
  prompt_generate: "프롬프트 만들기",
  prompt_create: "프롬프트 등록",
  prompt_update: "프롬프트 수정",
  prompt_delete: "프롬프트 삭제",
  prompt_run: "프롬프트 실행",
  prompt_copy: "프롬프트 복사",
  agent_generate: "에이전트 만들기",
  agent_create: "에이전트 등록",
  agent_update: "에이전트 수정",
  agent_delete: "에이전트 삭제",
  agent_run: "에이전트 실행",
};

export async function listAuditLogs(filters: { action?: string; days?: number }) {
  const where: Record<string, unknown> = {};
  if (filters.action) where.action = filters.action;
  if (filters.days) where.createdAt = { gte: daysAgo(filters.days) };

  const logs = await db.auditLog.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return logs.map((l) => ({
    id: l.id,
    time: fmtDateTime(l.createdAt),
    user: l.user.name,
    action: AUDIT_ACTION_LABEL[l.action] ?? l.action,
    target: l.targetLabel ?? "—",
    files: l.fileCount > 0 ? `${l.fileCount}개` : "—",
    status: l.status === "success" ? "성공" : "실패",
  }));
}

// ---------- 설정 ----------
export async function listCategoriesAdmin() {
  return db.category.findMany({ orderBy: { order: "asc" } });
}

export async function addCategoryAdmin(name: string): Promise<void> {
  const count = await db.category.count();
  await db.category.create({ data: { name, order: count } });
}

export async function removeCategoryAdmin(id: string): Promise<void> {
  await db.category.delete({ where: { id } });
}

export async function getSettingsAdmin() {
  const [keywords, warning, globalLimit, departments, deptHeadcounts] = await Promise.all([
    db.setting.findUnique({ where: { key: "sensitive_keywords" } }),
    db.setting.findUnique({ where: { key: "registration_warning" } }),
    db.setting.findUnique({ where: { key: "global_daily_call_limit" } }),
    getDashboardDepartments(),
    getDeptHeadcounts(),
  ]);
  return {
    sensitiveKeywords: Array.isArray(keywords?.value) ? (keywords!.value as string[]) : [],
    registrationWarning: typeof warning?.value === "string" ? warning.value : "",
    globalDailyCallLimit: typeof globalLimit?.value === "number" ? globalLimit.value : 5000,
    departments,
    deptHeadcounts,
  };
}

export async function updateSensitiveKeywords(keywords: string[]): Promise<void> {
  await db.setting.upsert({
    where: { key: "sensitive_keywords" },
    update: { value: keywords },
    create: { key: "sensitive_keywords", value: keywords },
  });
}

export async function saveSettingsAdmin(data: { registrationWarning: string; globalDailyCallLimit: number }): Promise<void> {
  await db.$transaction([
    db.setting.upsert({
      where: { key: "registration_warning" },
      update: { value: data.registrationWarning },
      create: { key: "registration_warning", value: data.registrationWarning },
    }),
    db.setting.upsert({
      where: { key: "global_daily_call_limit" },
      update: { value: data.globalDailyCallLimit },
      create: { key: "global_daily_call_limit", value: data.globalDailyCallLimit },
    }),
  ]);
}
