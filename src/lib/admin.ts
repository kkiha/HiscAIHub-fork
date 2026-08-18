// 관리자 콘솔 데이터 계층 — DB ↔ 관리자 콘솔 DTO 변환.
//
// 대시보드·리더보드는 기획서 개정(2026-08-13)으로 전 임직원 공개 영역이 되어 lib/dashboard.ts로 옮겼다.
// 여기 남은 것은 관리자만 하는 일(콘텐츠 관리·신고 처리·사용자 권한·사용량 비용·설정)뿐이다.
import { db } from "./db";
import { isContentStatus, type ContentStatus } from "./domain-values";

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

// ---------- 콘텐츠 관리 ----------
export type ContentRow = {
  id: string;
  title: string;
  author: string;
  dept: string;
  metric: string;
  status: "pub" | "hidden" | "flag";
  official: boolean;
};

const STATUS_MAP: Record<ContentStatus, ContentRow["status"]> = {
  published: "pub",
  hidden: "hidden",
  flagged: "flag",
};

function adminContentStatus(status: string): ContentRow["status"] {
  // [SQLITE] String 필드가 기존 ContentStatus 허용값이 아니면 안전하게 신고 상태로 표시한다.
  return isContentStatus(status) ? STATUS_MAP[status] : "flag";
}

export async function listContent(): Promise<ContentRow[]> {
  const agents = await db.agent.findMany({
    include: { author: true, _count: { select: { reviews: true } } },
    orderBy: { createdAt: "desc" },
  });
  return agents.map((a) => ({
    id: a.id,
    title: a.name,
    author: a.author.name,
    dept: a.author.dept,
    metric: `실행 ${a.runCount} · 후기 ${a._count.reviews}`,
    status: adminContentStatus(a.status),
    official: a.official,
  }));
}

export async function toggleContentOfficial(id: string): Promise<boolean> {
  const a = await db.agent.findUniqueOrThrow({ where: { id } });
  const updated = await db.agent.update({ where: { id }, data: { official: !a.official } });
  return updated.official;
}

export async function toggleContentHidden(id: string): Promise<"pub" | "hidden"> {
  const a = await db.agent.findUniqueOrThrow({ where: { id } });
  const next = a.status === "hidden" ? "published" : "hidden";
  await db.agent.update({ where: { id }, data: { status: next } });
  return STATUS_MAP[next] as "pub" | "hidden";
}

export async function deleteContent(id: string): Promise<void> {
  await db.agent.delete({ where: { id } });
}

// ---------- 신고 처리 ----------
export async function listPendingReports() {
  const reports = await db.report.findMany({
    where: { status: "pending" },
    include: { agent: true },
    orderBy: { createdAt: "asc" },
  });
  return reports.map((r) => ({
    id: r.id,
    contentId: r.agentId,
    title: r.agent.name,
    reason: r.reason,
    reporterCount: 1,
    date: fmtDateTime(r.createdAt),
  }));
}

export async function resolveReport(reportId: string, action: "keep" | "hide" | "delete"): Promise<void> {
  const report = await db.report.findUniqueOrThrow({ where: { id: reportId } });

  if (action === "delete") {
    // Report는 콘텐츠 삭제 시 cascade로 함께 삭제됨
    await db.agent.delete({ where: { id: report.agentId } });
    return;
  }

  if (action === "hide") {
    await db.agent.update({ where: { id: report.agentId }, data: { status: "hidden" } });
  }

  await db.report.update({ where: { id: reportId }, data: { status: "resolved", action, resolvedAt: new Date() } });
}

// ---------- 사용자·권한 ----------
export async function listUsersAdmin() {
  const users = await db.user.findMany({
    include: { _count: { select: { agents: true } } },
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    dept: u.dept,
    email: u.email,
    posts: u._count.agents,
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
  const FEATURE_LABEL: Record<string, string> = { agent_generate: "에이전트 만들기" };
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

// ---------- 감사 로그 ----------
const AUDIT_ACTION_LABEL: Record<string, string> = {
  agent_generate: "에이전트 만들기",
  agent_create: "에이전트 등록",
  agent_update: "에이전트 수정",
  agent_delete: "에이전트 삭제",
  agent_run: "에이전트 실행",
  agent_copy: "정의 복사",
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
    dept: l.deptSnapshot,
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
