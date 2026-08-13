// 관리자 콘솔 데이터 계층 — DB ↔ 관리자 콘솔 DTO 변환.
import { db } from "./db";

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

// ---------- 대시보드 ----------
export async function getDashboardStats(days: number) {
  const periodStart = daysAgo(days);
  const previousPeriodStart = daysAgo(days * 2);

  const [activeUsersInPeriod, activeUsersInPreviousPeriod, newPrompts, newAgents, callsInPeriod, callsInPreviousPeriod, costAgg] =
    await Promise.all([
      db.auditLog.findMany({ where: { createdAt: { gte: periodStart }, action: { in: [...RUN_ACTIONS] } }, distinct: ["userId"], select: { userId: true } }),
      db.auditLog.findMany({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart }, action: { in: [...RUN_ACTIONS] } }, distinct: ["userId"], select: { userId: true } }),
      db.prompt.count({ where: { createdAt: { gte: periodStart } } }),
      db.agent.count({ where: { createdAt: { gte: periodStart } } }),
      db.usageLog.count({ where: { createdAt: { gte: periodStart } } }),
      db.usageLog.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),
      db.usageLog.aggregate({ where: { createdAt: { gte: periodStart } }, _sum: { costUsd: true } }),
    ]);

  const pendingReports = await db.report.findMany({
    where: { status: "pending" },
    include: { prompt: true, agent: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const topPrompts = await db.prompt.findMany({ orderBy: { runCount: "desc" }, take: 5, select: { id: true, title: true, runCount: true } });
  const topAgents = await db.agent.findMany({ orderBy: { runCount: "desc" }, take: 5, select: { id: true, name: true, runCount: true } });
  const topContent = [
    ...topPrompts.map((p) => ({ type: "프롬프트" as const, title: p.title, runs: p.runCount })),
    ...topAgents.map((a) => ({ type: "에이전트" as const, title: a.name, runs: a.runCount })),
  ]
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
  const [prompts, agents] = await Promise.all([
    db.prompt.findMany({ include: { author: true }, orderBy: { createdAt: "desc" } }),
    db.agent.findMany({ include: { author: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const promptRows: ContentRow[] = prompts.map((p) => ({
    id: p.id,
    type: "프롬프트",
    title: p.title,
    author: p.author.name,
    dept: p.author.dept,
    metric: `실행 ${p.runCount}`,
    status: STATUS_MAP[p.status],
    official: p.official,
  }));
  const agentRows: ContentRow[] = agents.map((a) => ({
    id: a.id,
    type: "에이전트",
    title: a.name,
    author: a.author.name,
    dept: a.author.dept,
    metric: `실행 ${a.runCount}`,
    status: STATUS_MAP[a.status],
    official: a.official,
  }));
  return [...promptRows, ...agentRows].sort((a, b) => (a.title < b.title ? -1 : 1));
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
  const users = await db.user.findMany({
    include: { _count: { select: { prompts: true, agents: true } } },
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    dept: u.dept,
    email: u.email,
    posts: u._count.prompts + u._count.agents,
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
  const [runLogs, prompts, agents] = await Promise.all([
    db.auditLog.findMany({ where: { createdAt: range, action: { in: [...RUN_ACTIONS] } }, include: { user: true } }),
    // 프롬프트 제거 시 이 블록에서 Prompt 관련 조회만 삭제하면 된다.
    db.prompt.findMany({ where: { createdAt: range }, include: { author: true } }),
    db.agent.findMany({ where: { createdAt: range }, include: { author: true } }),
  ]);

  const byDept: PeriodTotals["byDept"] = new Map();
  const byUser: PeriodTotals["byUser"] = new Map();

  for (const log of runLogs) {
    ensureDept(byDept, log.user.dept).runs += 1;
    ensureDept(byDept, log.user.dept).activeUsers.add(log.userId);
    ensureUser(byUser, log.userId, log.user.name, log.user.dept).runs += 1;
  }
  for (const p of prompts) {
    ensureDept(byDept, p.author.dept).registrations += 1;
    ensureUser(byUser, p.authorId, p.author.name, p.author.dept).registrations += 1;
  }
  for (const a of agents) {
    ensureDept(byDept, a.author.dept).registrations += 1;
    ensureUser(byUser, a.authorId, a.author.name, a.author.dept).registrations += 1;
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
  const [keywords, warning, globalLimit] = await Promise.all([
    db.setting.findUnique({ where: { key: "sensitive_keywords" } }),
    db.setting.findUnique({ where: { key: "registration_warning" } }),
    db.setting.findUnique({ where: { key: "global_daily_call_limit" } }),
  ]);
  return {
    sensitiveKeywords: Array.isArray(keywords?.value) ? (keywords!.value as string[]) : [],
    registrationWarning: typeof warning?.value === "string" ? warning.value : "",
    globalDailyCallLimit: typeof globalLimit?.value === "number" ? globalLimit.value : 5000,
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
