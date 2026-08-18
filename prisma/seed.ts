// design-reference/agent_hub_v3_mockup.html 의 목 데이터를 DB로 이관.
// 데이터 값 자체는 seed-data.ts에 두고, 여기서는 적재 순서와 파생 로그 생성만 담당한다.
import { PrismaClient } from "@prisma/client";
import { fromStringList } from "../src/lib/json-list";
import { AGENTS, CATEGORIES, SPREAD, SUBSCRIPTION, TEAM_MEMBER, USERS } from "./seed-data";

const db = new PrismaClient();

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  console.log("기존 콘텐츠 정리 중...");
  // User/Category는 아래에서 upsert하므로 콘텐츠성 테이블만 비운다.
  await db.notification.deleteMany();
  await db.report.deleteMany();
  await db.review.deleteMany();
  await db.save.deleteMany();
  await db.agentOutput.deleteMany();
  await db.agent.deleteMany();
  await db.auditLog.deleteMany();
  await db.usageLog.deleteMany();
  await db.subscriptionRow.deleteMany();
  await db.subscriptionSnapshot.deleteMany();

  console.log("카테고리 적재 중...");
  for (const [i, name] of CATEGORIES.entries()) {
    await db.category.upsert({
      where: { name },
      update: { order: i },
      create: { name, order: i },
    });
  }
  // 개정 전 카테고리가 남아 있으면 지운다.
  await db.category.deleteMany({ where: { name: { notIn: CATEGORIES } } });

  console.log("사용자 적재 중...");
  const userByName = new Map<string, string>();
  for (const u of USERS) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, dept: u.dept, role: u.role, lastActiveAt: daysAgo(1) },
      create: { email: u.email, name: u.name, dept: u.dept, role: u.role, lastActiveAt: daysAgo(1) },
    });
    userByName.set(u.name, user.id);
  }

  console.log("에이전트 적재 중...");
  const agentIdByKey = new Map<string, string>();
  for (const a of AGENTS) {
    const authorId = userByName.get(a.author);
    if (!authorId) throw new Error(`작성자를 찾을 수 없습니다: ${a.author}`);

    const created = await db.agent.create({
      data: {
        name: a.name,
        description: a.desc,
        category: a.cat,
        official: a.official ?? false,
        runCount: a.runs,
        runType: a.runType,
        trigger: a.trigger,
        targetTask: a.targetTask,
        // [SQLITE] PostgreSQL 복귀 시: Json 변환을 제거하고 배열을 직접 저장한다.
        tasks: fromStringList(a.tasks),
        tools: fromStringList(a.tools),
        effect: a.effect,
        timeBefore: a.timeBefore,
        timeAfter: a.timeAfter,
        prerequisites: fromStringList(a.prerequisites),
        howToUse: fromStringList(a.howToUse),
        instructions: a.instructions,
        linkUrl: a.linkUrl,
        authorId,
        createdAt: daysAgo(a.daysAgo),
        outputs: { create: a.outputs.map((o, i) => ({ src: o.src, caption: o.caption, order: i })) },
      },
    });
    agentIdByKey.set(a.key, created.id);

    for (const r of a.reviews) {
      const reviewerId = userByName.get(r.author);
      if (!reviewerId) throw new Error(`후기 작성자를 찾을 수 없습니다: ${r.author}`);
      await db.review.create({
        data: {
          agentId: created.id,
          userId: reviewerId,
          useCase: r.useCase,
          effect: r.effect,
          timeBefore: r.timeBefore,
          timeAfter: r.timeAfter,
          createdAt: daysAgo(r.daysAgo),
        },
      });
      // 후기는 공개 — 작성자에게 알림이 간다 (본인 후기는 제외).
      if (reviewerId !== authorId) {
        await db.notification.create({
          data: {
            type: "review",
            recipientId: authorId,
            actorId: reviewerId,
            agentId: created.id,
            reviewText: r.useCase,
            createdAt: daysAgo(r.daysAgo),
          },
        });
      }
    }
  }

  console.log("저장(비공개 북마크) 적재 중...");
  const saves: [string, string][] = [
    ["권다은", "a4"],
    ["권다은", "a1"],
    ["박소영", "a3"],
    ["윤서연", "a2"],
  ];
  for (const [userName, agentKey] of saves) {
    await db.save.create({
      data: { userId: userByName.get(userName)!, agentId: agentIdByKey.get(agentKey)!, createdAt: daysAgo(3) },
    });
  }

  console.log("등록 감사 로그 생성 중...");
  for (const a of AGENTS) {
    const author = USERS.find((u) => u.name === a.author)!;
    await db.auditLog.create({
      data: {
        userId: userByName.get(a.author)!,
        deptSnapshot: author.dept,
        action: "agent_create",
        targetType: "agent",
        targetId: agentIdByKey.get(a.key)!,
        targetLabel: a.name,
        createdAt: daysAgo(a.daysAgo),
      },
    });
  }

  console.log("실행 감사 로그(부서 확산) 생성 중...");
  // 대시보드의 팀 랭킹·확산 행렬·카테고리·절감 시간이 전부 이 로그에서 파생된다.
  // 최근 30일에 고르게 흩어 두어야 7/30/90일 기간 필터가 의미 있게 동작한다.
  const runLogs: {
    userId: string;
    deptSnapshot: string;
    action: "agent_run";
    targetType: string;
    targetId: string;
    targetLabel: string;
    createdAt: Date;
  }[] = [];

  for (const [agentKey, byTeam] of Object.entries(SPREAD)) {
    const agent = AGENTS.find((a) => a.key === agentKey)!;
    const agentId = agentIdByKey.get(agentKey)!;
    for (const [team, count] of Object.entries(byTeam)) {
      const memberName = TEAM_MEMBER[team];
      const userId = userByName.get(memberName);
      if (!userId) throw new Error(`팀 대표 사용자를 찾을 수 없습니다: ${team}`);

      const push = (n: number, minDay: number, spanDays: number) => {
        for (let i = 0; i < n; i++) {
          runLogs.push({
            userId,
            deptSnapshot: team,
            action: "agent_run",
            targetType: "agent",
            targetId: agentId,
            targetLabel: agent.name,
            createdAt: daysAgo(minDay + Math.floor(Math.random() * spanDays), 9 + (i % 9)),
          });
        }
      };

      // 최근 30일 = 목업 SPREAD 값 그대로. 대시보드 30일 기준 수치가 목업과 일치해야 한다.
      push(count, 0, 30);
      // 직전 30일(30~59일 전)은 팀마다 다른 비율로 깔아 증감률이 0이 아닌 값으로 나오게 한다.
      // 비율을 팀 이름 해시로 고정해 시드를 다시 돌려도 증감 방향이 뒤집히지 않는다.
      const ratio = 0.6 + ((team.length * 7 + agentKey.charCodeAt(1)) % 5) * 0.12;
      push(Math.round(count * ratio), 30, 30);
    }
  }
  await db.auditLog.createMany({ data: runLogs });
  console.log(`  실행 로그 ${runLogs.length}건`);

  console.log("AI 생성 사용량 로그 생성 중...");
  const usageLogs = [];
  for (let d = 0; d < 7; d++) {
    const count = 3 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const u = USERS[Math.floor(Math.random() * USERS.length)];
      const tokensIn = 900 + Math.floor(Math.random() * 1200);
      const tokensOut = 700 + Math.floor(Math.random() * 1500);
      usageLogs.push({
        userId: userByName.get(u.name)!,
        feature: "agent_generate",
        tokensIn,
        tokensOut,
        costUsd: (tokensIn / 1_000_000) * 3 + (tokensOut / 1_000_000) * 15,
        createdAt: daysAgo(d, 9 + (i % 9)),
      });
    }
  }
  await db.usageLog.createMany({ data: usageLogs });
  console.log(`  사용량 로그 ${usageLogs.length}건`);

  console.log("신고 적재 중...");
  await db.report.create({
    data: {
      reason: "실행 방법 설명이 실제와 달라 따라 할 수 없습니다.",
      reporterId: userByName.get("정하은")!,
      agentId: agentIdByKey.get("a5")!,
      createdAt: daysAgo(2),
    },
  });

  console.log("구독 현황 스냅샷 적재 중...");
  const snapshot = await db.subscriptionSnapshot.create({
    data: {
      period: SUBSCRIPTION.period,
      label: SUBSCRIPTION.label,
      note: SUBSCRIPTION.note,
      totalUsers: SUBSCRIPTION.totalUsers,
      totalAccounts: SUBSCRIPTION.totalAccounts,
      totalCostManwon: SUBSCRIPTION.totalCostManwon,
    },
  });
  await db.subscriptionRow.createMany({
    data: [
      ...SUBSCRIPTION.divisions.map((d, i) => ({
        snapshotId: snapshot.id,
        scope: "division" as const,
        name: d.name,
        division: null,
        users: d.users,
        costManwon: d.cost,
        tools: d.tools,
        order: i,
      })),
      ...SUBSCRIPTION.teams.map((t, i) => ({
        snapshotId: snapshot.id,
        scope: "team" as const,
        name: t.name,
        division: t.div,
        users: t.users,
        costManwon: t.cost,
        tools: t.tools,
        order: i,
      })),
    ],
  });

  console.log("운영 설정 적재 중...");
  const settings: [string, unknown][] = [
    ["sensitive_keywords", ["주민등록번호", "계좌번호", "고객명", "휴대폰번호"]],
    ["registration_warning", "고객 실명·계좌번호 등 민감정보는 에이전트 정의에 포함하지 마세요."],
    ["global_daily_call_limit", 5000],
    ["per_user_daily_call_limit", 100],
  ];
  for (const [key, value] of settings) {
    await db.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }

  console.log("\n완료");
  console.log(`  사용자 ${USERS.length} · 에이전트 ${AGENTS.length} · 카테고리 ${CATEGORIES.length}`);
  console.log(`  실행 로그 ${runLogs.length} · 사용량 로그 ${usageLogs.length}`);
  console.log(`  구독 스냅샷 ${SUBSCRIPTION.label} (부문 ${SUBSCRIPTION.divisions.length} · 팀 ${SUBSCRIPTION.teams.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
