// 관리자 대시보드 통계용 목업 사용량·감사 로그 추가 스크립트.
// prisma/seed.ts의 UsageLog/AuditLog는 특정 시점(초기 시딩 시각) 기준 상대 시간이라
// 시간이 지나면 대시보드의 "최근 7일" 집계 범위 밖으로 밀려나 수치가 0으로 보임.
// 이 스크립트는 실행 시점 기준 최근 14일에 걸쳐 로그를 추가로 채워 넣는다.
// 기존 데이터는 건드리지 않고 추가만 하므로 여러 번 실행하면 중복 누적됨 — 필요할 때만 실행.
import { PrismaClient } from "@prisma/client";
import type { AuditAction, AuditStatus } from "../src/lib/domain-values";

const db = new PrismaClient();

const USER_EMAILS = [
  "202502035@hanwha.com", // 권다은
  "soyoung.park@hanwha.com", // 박소영
  "minjun.choi@hanwha.com", // 최민준
  "taeyang.kang@hanwha.com", // 강태양
  "seoyeon.yoon@hanwha.com", // 윤서연
  "haeun.jung@hanwha.com", // 정하은
  "jiwoo.han@hanwha.com", // 한지우
  "dohyun.lee@hanwha.com", // 이도현
  "yujin.kim@hanwha.com", // 김유진
  "sehun.oh@hanwha.com", // 오세훈
  "jihun.bae@hanwha.com", // 배지훈
  "yerin.song@hanwha.com", // 송예린
];

// UsageLog는 백엔드 Claude API 호출(=비용 발생)만 기록한다. "실행"(prompt_run/agent_run)은
// claude.ai 딥링크로 각자 PC에서 이뤄져 백엔드 호출·비용이 없으므로 여기 포함하지 않는다
// (아래 AUDIT_ACTIONS 쪽에서 별도로 다룬다).
const FEATURE_COST: Record<string, [number, number]> = {
  prompt_generate: [0.01, 0.03],
  agent_generate: [0.02, 0.04],
};

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hoursAgoDate(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  const users = await db.user.findMany({ where: { email: { in: USER_EMAILS } } });
  if (users.length === 0) throw new Error("사용자를 찾을 수 없습니다. 먼저 npm run db:seed를 실행하세요.");

  const prompts = await db.prompt.findMany({ select: { id: true, title: true } });
  const agents = await db.agent.findMany({ select: { id: true, name: true } });

  console.log("최근 14일 목업 사용량/감사 로그 생성 중...");

  // ---------- 사용량 로그: 최근 14일, 하루 3~7건, 주중에 더 활발 ----------
  const usageRows: { userId: string; feature: string; costUsd: number; createdAt: Date }[] = [];
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const date = hoursAgoDate(dayOffset * 24);
    const isWeekend = [0, 6].includes(date.getDay());
    const count = isWeekend ? Math.floor(rand(1, 3)) : Math.floor(rand(4, 8));
    for (let i = 0; i < count; i++) {
      const feature = pick(Object.keys(FEATURE_COST));
      const [min, max] = FEATURE_COST[feature];
      const hourOfDay = rand(9, 20); // 업무 시간대
      const createdAt = new Date(date);
      createdAt.setHours(Math.floor(hourOfDay), Math.floor(rand(0, 60)), 0, 0);
      usageRows.push({
        userId: pick(users).id,
        feature,
        costUsd: Math.round(rand(min, max) * 1000) / 1000,
        createdAt,
      });
    }
  }
  await db.usageLog.createMany({ data: usageRows });

  // ---------- 감사 로그: 사용량 로그와 유사한 패턴, 실패 케이스 소량 포함 ----------
  const AUDIT_ACTIONS: AuditAction[] = ["agent_run", "prompt_generate", "prompt_run", "prompt_copy", "agent_generate"];
  const auditRows: {
    userId: string;
    action: AuditAction;
    targetType: "prompt" | "agent" | null;
    targetId: string | null;
    targetLabel: string;
    fileCount: number;
    status: AuditStatus;
    createdAt: Date;
  }[] = [];
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const date = hoursAgoDate(dayOffset * 24);
    const isWeekend = [0, 6].includes(date.getDay());
    const count = isWeekend ? Math.floor(rand(1, 2)) : Math.floor(rand(3, 6));
    for (let i = 0; i < count; i++) {
      const action = pick(AUDIT_ACTIONS);
      const usesAgent = action === "agent_run" || action === "agent_generate";
      const agentTarget = usesAgent && agents.length ? pick(agents) : null;
      const promptTarget = !usesAgent && prompts.length ? pick(prompts) : null;
      const targetLabel = agentTarget?.name ?? promptTarget?.title ?? "—";
      let targetType: "prompt" | "agent" | null = null;
      let targetId: string | null = null;
      if (action === "agent_run" && agentTarget) {
        targetType = "agent";
        targetId = agentTarget.id;
      } else if (action === "prompt_run" && promptTarget) {
        targetType = "prompt";
        targetId = promptTarget.id;
      }
      const hourOfDay = rand(9, 20);
      const createdAt = new Date(date);
      createdAt.setHours(Math.floor(hourOfDay), Math.floor(rand(0, 60)), 0, 0);
      auditRows.push({
        userId: pick(users).id,
        action,
        targetType,
        targetId,
        targetLabel,
        fileCount: action === "agent_run" ? Math.floor(rand(0, 3)) : 0,
        status: Math.random() < 0.06 ? "failure" : "success",
        createdAt,
      });
    }
  }
  await db.auditLog.createMany({ data: auditRows });

  // ---------- 사용자 최근 활동 시각 갱신 ----------
  for (const u of users) {
    const last = [...usageRows, ...auditRows]
      .filter((r) => r.userId === u.id)
      .map((r) => r.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (last) {
      await db.user.update({ where: { id: u.id }, data: { lastActiveAt: last } });
    }
  }

  // ---------- "이번 주 신규 콘텐츠" 표본 확보: 기존 콘텐츠 중 2건을 최근으로 이동 ----------
  const recentPrompt = prompts.find((p) => p.title === "상품 약관 쉬운 설명 변환");
  const recentAgent = agents.find((a) => a.name === "업무 자동화 비서");
  if (recentPrompt) {
    await db.prompt.update({ where: { id: recentPrompt.id }, data: { createdAt: hoursAgoDate(rand(20, 70)) } });
  }
  if (recentAgent) {
    await db.agent.update({ where: { id: recentAgent.id }, data: { createdAt: hoursAgoDate(rand(20, 70)) } });
  }

  console.log(`완료: 사용량 로그 ${usageRows.length}건, 감사 로그 ${auditRows.length}건 추가.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
