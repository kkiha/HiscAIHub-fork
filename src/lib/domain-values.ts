export const USER_ROLES = ["admin", "mod", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CONTENT_STATUSES = ["published", "hidden", "flagged"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const REPORT_STATUSES = ["pending", "resolved"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_ACTIONS = ["keep", "hide", "delete"] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];

export const NOTIFICATION_TYPES = ["comment"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const AUDIT_ACTIONS = [
  "prompt_generate",
  "prompt_create",
  "prompt_update",
  "prompt_delete",
  "prompt_run",
  "prompt_copy",
  "agent_generate",
  "agent_create",
  "agent_update",
  "agent_delete",
  "agent_run",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_STATUSES = ["success", "failure"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

function includesValue<const T extends readonly string[]>(values: T, value: string): value is T[number] {
  return (values as readonly string[]).includes(value);
}

export const isUserRole = (value: string): value is UserRole => includesValue(USER_ROLES, value);
export const isContentStatus = (value: string): value is ContentStatus => includesValue(CONTENT_STATUSES, value);
export const isReportStatus = (value: string): value is ReportStatus => includesValue(REPORT_STATUSES, value);
export const isReportAction = (value: string): value is ReportAction => includesValue(REPORT_ACTIONS, value);
export const isNotificationType = (value: string): value is NotificationType => includesValue(NOTIFICATION_TYPES, value);
export const isAuditAction = (value: string): value is AuditAction => includesValue(AUDIT_ACTIONS, value);
export const isAuditStatus = (value: string): value is AuditStatus => includesValue(AUDIT_STATUSES, value);
