// 감사 로그 기록 — deptSnapshot 주입을 한곳으로 모은다.
//
// deptSnapshot을 호출부마다 직접 넣게 두면 한 군데만 빠져도 부서 확산 대시보드에
// 구멍이 생긴다(그 행은 어느 팀 실행인지 알 수 없게 된다). 그래서 기록은 전부 이 함수를 거친다.
import type { Prisma, User } from "@prisma/client";
// [SQLITE] PostgreSQL 복귀 시: AuditAction, AuditStatus를 @prisma/client에서 import한다.
import type { AuditAction, AuditStatus } from "./domain-values";
import { db } from "./db";

type AuditInput = {
  user: Pick<User, "id" | "dept">;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  fileCount?: number;
  status?: AuditStatus;
};

function toData(input: AuditInput): Prisma.AuditLogUncheckedCreateInput {
  return {
    userId: input.user.id,
    deptSnapshot: input.user.dept,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    fileCount: input.fileCount ?? 0,
    status: input.status ?? "success",
  };
}

export async function recordAudit(input: AuditInput): Promise<void> {
  await db.auditLog.create({ data: toData(input) });
}

/** db.$transaction 배열에 끼워 넣을 때 사용 — 카운터 증가와 같은 트랜잭션으로 묶는다. */
export function auditCreate(input: AuditInput) {
  return db.auditLog.create({ data: toData(input) });
}
