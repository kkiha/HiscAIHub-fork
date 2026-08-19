// 사내 시연용 현실화 데이터를 DB로 이관.
// 데이터 값 자체는 seed-data.ts에 두고, 여기서는 적재 순서·분산 배정·파생 로그 생성을 담당한다.
import { PrismaClient } from "@prisma/client";
import { AGENTS, CATEGORIES, SPREAD, SUBSCRIPTION, USERS } from "./seed-data";

const db = new PrismaClient();
const MAX_30_DAY_RUNS_PER_USER = 40;

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

/** 팀 실행을 상위 사용자가 조금 더 많이 가져가도록 나누되 월 40회 상한을 지킨다. */
function weightedRunCounts(total: number, activeUsers: number): number[] {
  if (total > activeUsers * MAX_30_DAY_RUNS_PER_USER) {
    throw new Error(`월 실행 상한으로 분배할 수 없습니다: ${total}회 / ${activeUsers}명`);
  }

  const weights = Array.from({ length: activeUsers }, (_, i) => activeUsers - i + 1);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const counts = weights.map((weight) => Math.floor((total * weight) / weightSum));
  let remainder = total - counts.reduce((sum, count) => sum + count, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % counts.length) {
    if (counts[i] >= MAX_30_DAY_RUNS_PER_USER) continue;
    counts[i] += 1;
    remainder -= 1;
  }

  if (counts.some((count) => count > MAX_30_DAY_RUNS_PER_USER)) {
    throw new Error(`개인 월 실행 상한 ${MAX_30_DAY_RUNS_PER_USER}회를 초과했습니다.`);
  }
  return counts;
}

/** 사용자별 목표 횟수를 라운드로빈 큐로 풀어 한 에이전트에 특정 사용자가 몰리지 않게 한다. */
function interleavedUserQueue(names: string[], counts: number[]): string[] {
  const remaining = [...counts];
  const queue: string[] = [];
  while (remaining.some((count) => count > 0)) {
    for (let i = 0; i < names.length; i++) {
      if (remaining[i] <= 0) continue;
      queue.push(names[i]);
      remaining[i] -= 1;
    }
  }
  return queue;
}

async function main() {
  if (USERS.length < 45 || USERS.length > 60) {
    throw new Error(`사용자 목표 범위(45~60명)를 벗어났습니다: ${USERS.length}명`);
  }
  if (AGENTS.length < 18 || AGENTS.length > 28) {
    throw new Error(`에이전트 목표 범위(18~28건)를 벗어났습니다: ${AGENTS.length}건`);
  }
  const recentRegistrations = AGENTS.filter((agent) => agent.daysAgo <= 30).length;
  if (recentRegistrations < 18 || recentRegistrations > 28) {
    throw new Error(`최근 30일 등록 목표 범위(18~28건)를 벗어났습니다: ${recentRegistrations}건`);
  }

  for (const agent of AGENTS) {
    const requiredText = [agent.name, agent.desc, agent.targetTask, agent.effect, agent.instructions];
    const requiredLists = [agent.tasks, agent.tools, agent.prerequisites, agent.howToUse, agent.outputs];
    if (requiredText.some((value) => !value.trim() || /TODO|TBD|자리표시자/i.test(value))) {
      throw new Error(`에이전트 필수 설명이 비었거나 자리표시자입니다: ${agent.key}`);
    }
    if (requiredLists.some((values) => values.length === 0)) {
      throw new Error(`에이전트 필수 목록이 비었습니다: ${agent.key}`);
    }
    const spreadTotal = Object.values(SPREAD[agent.key] ?? {}).reduce((sum, count) => sum + count, 0);
    if (spreadTotal !== agent.runs) {
      throw new Error(`에이전트 실행 합계가 맞지 않습니다: ${agent.key} (${agent.runs} / ${spreadTotal})`);
    }
  }

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
  await db.category.deleteMany({ where: { name: { notIn: [...CATEGORIES] } } });

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
        tasks: a.tasks,
        tools: a.tools,
        effect: a.effect,
        timeBefore: a.timeBefore,
        timeAfter: a.timeAfter,
        prerequisites: a.prerequisites,
        howToUse: a.howToUse,
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

  const recentRunsByTeam = new Map<string, number>();
  for (const byTeam of Object.values(SPREAD)) {
    for (const [team, count] of Object.entries(byTeam)) {
      recentRunsByTeam.set(team, (recentRunsByTeam.get(team) ?? 0) + count);
    }
  }

  const activeMembersByTeam = new Map<string, string[]>();
  const recentUserQueueByTeam = new Map<string, string[]>();
  for (const [team, total] of recentRunsByTeam) {
    const members = USERS.filter((user) => user.dept === team);
    if (members.length < 5 || members.length > 8) {
      throw new Error(`팀 인원 목표 범위(5~8명)를 벗어났습니다: ${team} ${members.length}명`);
    }

    // 팀마다 마지막 1명은 최근 30일 실행 0회로 남겨 전원 활성인 분포를 피한다.
    const activeNames = members.slice(0, -1).map((user) => user.name);
    const counts = weightedRunCounts(total, activeNames.length);
    activeMembersByTeam.set(team, activeNames);
    recentUserQueueByTeam.set(team, interleavedUserQueue(activeNames, counts));
  }

  const recentRunCountByUser = new Map<string, number>();
  const previousOffsetByTeam = new Map<string, number>();

  for (const [agentKey, byTeam] of Object.entries(SPREAD)) {
    const agent = AGENTS.find((a) => a.key === agentKey)!;
    const agentId = agentIdByKey.get(agentKey)!;
    for (const [team, count] of Object.entries(byTeam)) {
      const recentQueue = recentUserQueueByTeam.get(team);
      const activeNames = activeMembersByTeam.get(team);
      if (!recentQueue || !activeNames) throw new Error(`팀 사용자 분배 정보를 찾을 수 없습니다: ${team}`);

      // 최근 30일 실행은 팀별 사용자 큐에서 꺼내 에이전트와 무관하게 고르게 분산한다.
      for (let i = 0; i < count; i++) {
        const memberName = recentQueue.shift();
        const userId = memberName ? userByName.get(memberName) : null;
        if (!memberName || !userId) throw new Error(`최근 실행 사용자를 찾을 수 없습니다: ${team}`);
        const nextCount = (recentRunCountByUser.get(memberName) ?? 0) + 1;
        if (nextCount > MAX_30_DAY_RUNS_PER_USER) {
          throw new Error(`${memberName}의 최근 30일 실행이 ${MAX_30_DAY_RUNS_PER_USER}회를 초과했습니다.`);
        }
        recentRunCountByUser.set(memberName, nextCount);
        runLogs.push({
          userId,
          deptSnapshot: team,
          action: "agent_run",
          targetType: "agent",
          targetId: agentId,
          targetLabel: agent.name,
          createdAt: daysAgo(1 + Math.floor(Math.random() * 29), 9 + (i % 9)),
        });
      }

      // 직전 기간은 31~59일 전으로 두어 시간대에 따라 최근 30일 창에 걸치는 경계 로그를 막는다.
      // 비율을 팀 이름 해시로 고정해 시드를 다시 돌려도 증감 방향이 뒤집히지 않는다.
      const ratio = 0.6 + ((team.length * 7 + agentKey.charCodeAt(1)) % 5) * 0.12;
      const previousCount = Math.round(count * ratio);
      const offset = previousOffsetByTeam.get(team) ?? 0;
      for (let i = 0; i < previousCount; i++) {
        const memberName = activeNames[(offset + i) % activeNames.length];
        const userId = userByName.get(memberName)!;
        runLogs.push({
          userId,
          deptSnapshot: team,
          action: "agent_run",
          targetType: "agent",
          targetId: agentId,
          targetLabel: agent.name,
          createdAt: daysAgo(31 + Math.floor(Math.random() * 29), 9 + (i % 9)),
        });
      }
      previousOffsetByTeam.set(team, offset + previousCount);
    }
  }

  for (const [team, queue] of recentUserQueueByTeam) {
    if (queue.length > 0) throw new Error(`팀 실행 분배가 완료되지 않았습니다: ${team} ${queue.length}회`);
  }
  await db.auditLog.createMany({ data: runLogs });
  console.log(`  실행 로그 ${runLogs.length}건 · 최근 30일 ${[...recentRunsByTeam.values()].reduce((sum, count) => sum + count, 0)}건`);
  console.log(`  활성 사용자 ${recentRunCountByUser.size}명 · 개인 최대 ${Math.max(...recentRunCountByUser.values())}회`);

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
    [
      "division_headcount",
      {
        디지털부문: 138,
        WM부문: 74,
        홀세일부문: 58,
        경영지원실: 46,
        IB부문: 35,
        상품전략실: 24,
        리스크관리실: 27,
        준법관리실: 19,
        전략기획실: 22,
        IT지원실: 16,
      },
    ],
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
