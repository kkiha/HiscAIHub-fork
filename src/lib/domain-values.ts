// [SQLITE] Prisma enum을 String으로 바꾸면서 허용값을 여기서 관리한다.
// PostgreSQL 복귀 시: 이 파일을 삭제하고 Prisma enum import로 되돌린다.

export const USER_ROLES = ["admin", "mod", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.some((item) => item === value);
}

export const CONTENT_STATUSES = ["published", "hidden", "flagged"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export function isContentStatus(value: unknown): value is ContentStatus {
  return typeof value === "string" && CONTENT_STATUSES.some((item) => item === value);
}

export const REPORT_STATUSES = ["pending", "resolved"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && REPORT_STATUSES.some((item) => item === value);
}

export const REPORT_ACTIONS = ["keep", "hide", "delete"] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];
export function isReportAction(value: unknown): value is ReportAction {
  return typeof value === "string" && REPORT_ACTIONS.some((item) => item === value);
}

export const NOTIFICATION_TYPES = ["review"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && NOTIFICATION_TYPES.some((item) => item === value);
}

export const AUDIT_ACTIONS = [
  "agent_generate",
  "agent_create",
  "agent_update",
  "agent_delete",
  "agent_run",
  "agent_copy",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === "string" && AUDIT_ACTIONS.some((item) => item === value);
}

export const AUDIT_STATUSES = ["success", "failure"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export function isAuditStatus(value: unknown): value is AuditStatus {
  return typeof value === "string" && AUDIT_STATUSES.some((item) => item === value);
}

export const RUN_TYPES = ["schedule", "event", "skill", "app"] as const;
export type RunType = (typeof RUN_TYPES)[number];
export function isRunType(value: unknown): value is RunType {
  return typeof value === "string" && RUN_TYPES.some((item) => item === value);
}

export const TIME_BANDS = ["under_10m", "m10_30", "m30_60", "h1_3", "h3_8", "over_1d"] as const;
export type TimeBand = (typeof TIME_BANDS)[number];
export function isTimeBand(value: unknown): value is TimeBand {
  return typeof value === "string" && TIME_BANDS.some((item) => item === value);
}

export const SUB_SCOPES = ["division", "team"] as const;
export type SubScope = (typeof SUB_SCOPES)[number];
export function isSubScope(value: unknown): value is SubScope {
  return typeof value === "string" && SUB_SCOPES.some((item) => item === value);
}
