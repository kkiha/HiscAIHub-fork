// design-reference/prompthub-demo_v16.html · prompthub-admin.html 의 데모 데이터를 DB로 이관.
import { PrismaClient } from "@prisma/client";
import { WORK_CATEGORIES, type WorkCategory } from "../src/lib/work-categories";

const db = new PrismaClient();

// 관리자 사용자·권한 표 + 프롬프트 작성자 기준.
// 권다은 = 실제 로그인 테스트 계정(202502035@hanwha.com) 본인. 나머지는 admin 표의
// {given}.{family}@hanwha.com 패턴을 따르는 시드 전용 동료 계정.
const USERS = [
  { key: "권다은", email: "202502035@hanwha.com", name: "권다은", dept: "AI Roll-up TFT", role: "user" as const },
  { key: "박소영", email: "soyoung.park@hanwha.com", name: "박소영", dept: "리서치센터", role: "mod" as const },
  { key: "최민준", email: "minjun.choi@hanwha.com", name: "최민준", dept: "컴플라이언스", role: "mod" as const },
  { key: "강태양", email: "taeyang.kang@hanwha.com", name: "강태양", dept: "WM영업", role: "user" as const },
  { key: "윤서연", email: "seoyeon.yoon@hanwha.com", name: "윤서연", dept: "해외주식", role: "user" as const },
  { key: "정하은", email: "haeun.jung@hanwha.com", name: "정하은", dept: "전략기획", role: "user" as const },
  { key: "한지우", email: "jiwoo.han@hanwha.com", name: "한지우", dept: "리서치센터", role: "user" as const },
  { key: "이도현", email: "dohyun.lee@hanwha.com", name: "이도현", dept: "WM영업", role: "user" as const },
];

type PromptSeed = {
  key: string;
  cat: WorkCategory;
  title: string;
  desc: string;
  body: string;
  author: string;
  copies: number;
  runs: number;
  official?: boolean;
  comments: { author: string; text: string }[];
};

const PROMPTS: PromptSeed[] = [
  {
    key: "p10", cat: "작성·요약", title: "오늘의 한 줄 시장 멘트 만들기",
    desc: "입력값 없이 바로 실행돼요. 고객에게 보낼 짧고 친근한 시장 인사 문구를 즉석에서 만들어줍니다.",
    body: "증권사 PB가 오늘 아침 고객에게 보낼 짧은 인사 메시지를 3가지 버전으로 만들어줘.\n각 버전은 2문장 이내로, 친근하지만 신뢰감 있는 톤으로. 투자 권유나 수익 보장 표현은 빼줘.",
    author: "이도현", copies: 62, runs: 35,
    comments: [{ author: "강태양", text: "바로 복사해서 쓰기 딱 좋아요. 결과도 금방 나오고!" }],
  },
  {
    key: "p1", cat: "조사·리서치", title: "종목 리서치 리포트 핵심 요약",
    desc: "애널리스트 리포트나 기업 분석 자료를 입력하면 투자포인트·리스크·목표주가 근거를 표로 정리해줍니다.",
    body: "다음 리서치 리포트를 읽고 아래 형식으로 정리해주세요.\n\n① 핵심 투자포인트 3가지\n② 주요 리스크 2가지\n③ 목표주가 산정 근거\n\n각 항목은 2줄 이내로 요약하고, 마지막에 한 줄 투자의견(매수/중립/매도)을 제시하세요.\n\n리포트: {{리포트내용}}",
    author: "박소영", copies: 210, runs: 96, official: true,
    comments: [
      { author: "윤서연", text: "영문 리포트에도 잘 작동해요. 번역까지 같이 해줘서 편합니다." },
      { author: "강태양", text: "고객 상담 전에 빠르게 핵심만 보기 좋네요." },
    ],
  },
  {
    key: "p2", cat: "작성·요약", title: "민원 답변 톤 교정 & 리스크 표현 점검",
    desc: "작성한 민원 답변 초안을 공손하고 명확한 금융사 공식 톤으로 다듬고, 법적 리스크가 될 수 있는 표현을 점검합니다.",
    body: "아래 고객 민원 답변 초안을 금융투자회사 공식 어조로 다듬어주세요.\n\n- 과도한 사과 표현은 줄이고 사실 중심으로\n- 법적 책임 인정으로 해석될 수 있는 문장은 중립적으로 수정\n- 단정적 수익 보장 표현이 있으면 경고\n\n초안: {{답변초안}}",
    author: "최민준", copies: 155, runs: 51,
    comments: [
      { author: "이도현", text: "리스크 표현 잡아주는 게 진짜 유용합니다." },
      { author: "박소영", text: "톤 교정만으로 답변 품질이 확 올라가요." },
      { author: "한지우", text: "단정적 보장 표현 경고가 컴플라이언스 관점에서 좋네요." },
      { author: "강태양", text: "고객 응대팀 전체에 공유했어요!" },
      { author: "정하은", text: "표준 답변 템플릿 만들 때도 활용 중입니다." },
    ],
  },
  {
    key: "p3", cat: "작성·요약", title: "주간 업무보고 자동 초안 작성기",
    desc: "한 주간 업무 내역을 붙여넣으면 팀장 보고용 포맷으로 분류·요약해 보고서 초안을 만들어줍니다.",
    body: "당신은 금융투자업 팀장 보고 전문 비서입니다.\n아래 업무 내역을 [완료 / 진행 중 / 예정]으로 분류하고, 핵심 성과와 이슈/리스크를 각각 3줄 이내로 요약한 뒤 주간보고 형식으로 작성해주세요.\n\n업무 내역: {{업무내역}}",
    author: "권다은", copies: 188, runs: 88,
    comments: [{ author: "정하은", text: "이슈/리스크 분리해주는 게 보고할 때 편해요!" }],
  },
  {
    key: "p4", cat: "조사·리서치", title: "DART 공시 자료 빠른 해설",
    desc: "전자공시(DART) 원문을 붙여넣으면 핵심 내용, 주가 영향, 투자자 관점 시사점을 정리해줍니다.",
    body: "다음 전자공시 자료를 읽고 아래를 정리해주세요.\n\n1. 공시 핵심 내용 (3줄 요약)\n2. 주가에 미칠 수 있는 영향 (긍정/부정/중립과 그 이유)\n3. 투자자 관점에서 추가로 확인해야 할 점\n\n전문 용어는 일반 투자자도 이해할 수 있게 풀어주세요.\n\n공시 원문: {{공시내용}}",
    author: "한지우", copies: 121, runs: 44,
    comments: [{ author: "박소영", text: "정정공시 해석할 때 특히 도움돼요." }],
  },
  {
    key: "p5", cat: "작성·요약", title: "펀드·ETF 비교 설명 자료 작성",
    desc: "여러 상품의 정보를 입력하면 고객 눈높이에 맞춰 비교 설명 자료를 만들어줍니다. 위험등급·수수료·특징 정리.",
    body: "아래 펀드/ETF 상품들을 고객에게 설명할 비교 자료로 만들어주세요.\n\n- 비교 항목: 운용전략, 위험등급, 총보수, 주요 편입자산, 적합한 투자 성향\n- 표 형식으로 정리\n- 마지막에 '투자 전 유의사항' 문구 포함 (원금 비보장 등)\n\n상품 정보: {{상품정보}}",
    author: "강태양", copies: 97, runs: 30, comments: [],
  },
  {
    key: "p6", cat: "번역·검토", title: "영문 IR·실적자료 번역 및 요약",
    desc: "해외 기업의 IR 자료나 어닝콜 스크립트를 한국어로 번역하고 핵심 수치·가이던스를 요약합니다.",
    body: "아래 영문 IR 자료를 자연스러운 한국어로 번역하고, 별도 섹션으로 다음을 요약해주세요.\n\n■ 핵심 재무 수치: 매출, 영업이익, EPS (전년 대비 증감 포함)\n■ 경영진 가이던스 / 향후 전망\n■ 시장이 주목할 만한 코멘트\n\n자료: {{영문텍스트}}",
    author: "윤서연", copies: 84, runs: 41, comments: [],
  },
  {
    key: "p7", cat: "자동화·개발", title: "시세 데이터 조회 SQL 생성기",
    desc: "원하는 조건을 자연어로 설명하면 시세·거래 데이터 조회용 SQL 쿼리로 변환해줍니다. 주석 포함.",
    body: "다음 조건에 맞는 SQL 쿼리를 작성해주세요.\n\nDB 종류: {{Oracle/PostgreSQL 등}}\n테이블 구조: {{테이블명과 컬럼}}\n원하는 결과: {{조회조건}}\n\n- 가독성을 위해 별칭과 주석을 달아주세요\n- 대용량 조회 시 성능 주의점도 한 줄 코멘트로 알려주세요",
    author: "강태양", copies: 66, runs: 22, comments: [],
  },
  {
    key: "p8", cat: "기획·아이디어", title: "회의록 정리 & 액션아이템 추출",
    desc: "회의 중 메모를 붙여넣으면 논의 요약·결정사항·액션아이템(담당자/기한)을 자동으로 분리 정리합니다.",
    body: "아래 회의 메모를 바탕으로 정리해주세요.\n\n① 논의 요약\n② 결정 사항\n③ 액션아이템 (담당자 / 기한 포함, 표로)\n④ 다음 회의 안건 후보\n\n메모: {{회의메모}}",
    author: "권다은", copies: 59, runs: 18, comments: [],
  },
  {
    key: "p9", cat: "번역·검토", title: "상품 약관 쉬운 설명 변환",
    desc: "복잡한 금융상품 약관·투자설명서 문구를 고객이 이해하기 쉬운 표현으로 바꿔줍니다. 원래 의미는 유지.",
    body: "아래 금융상품 약관/투자설명서 문구를 일반 고객이 이해할 수 있는 쉬운 표현으로 바꿔주세요.\n\n- 법적 의미는 바꾸지 말 것\n- 어려운 용어는 괄호로 짧게 설명\n- 고객에게 불리할 수 있는 조건은 굵게 표시하고 따로 강조\n\n원문: {{약관문구}}",
    author: "최민준", copies: 41, runs: 12, comments: [],
  },
];

// 데모에서 뷰어(권다은)가 저장한 프롬프트: id2, id5
const VIEWER_SAVED_PROMPTS = new Set(["p2", "p5"]);

type AgentSeed = {
  key: string;
  cat: WorkCategory;
  name: string;
  desc: string;
  instructions: string;
  tasks: string[];
  author: string;
  runs: number;
  comments: { author: string; text: string }[];
};

const AGENTS: AgentSeed[] = [
  {
    key: "a101", cat: "조사·리서치", name: "리서치 어시스턴트",
    desc: "리포트·공시를 요약하고 종목을 비교해주는 리서치 전용 에이전트예요.",
    instructions: "당신은 증권사 리서치센터의 애널리스트를 보조하는 AI 에이전트입니다.\n사용자가 리포트·공시·종목명을 주면 핵심 투자포인트, 주요 리스크, 목표주가 근거를 정리하고, 필요하면 종목 비교표를 만듭니다.\n\n규칙:\n- 한국어로 간결하고 명확하게 답합니다.\n- 단정적인 수익 보장이나 투자 권유로 해석될 표현은 피하고 사실 중심으로 작성합니다.\n- 정보가 부족하면 먼저 필요한 자료를 요청합니다.",
    tasks: ["이 리포트 핵심만 요약해줘", "A와 B 종목 비교해줘", "이 공시가 주가에 미칠 영향은?"],
    author: "박소영", runs: 64,
    comments: [{ author: "강태양", text: "종목 비교를 한 번에 해줘서 상담 준비가 빨라졌어요." }],
  },
  {
    key: "a102", cat: "작성·요약", name: "고객 응대 도우미",
    desc: "민원 답변 초안 작성, 상품 쉬운 설명, 답변 톤 교정을 도와주는 에이전트예요.",
    instructions: "당신은 금융투자회사의 고객 응대를 돕는 AI 에이전트입니다.\n민원 답변 초안 작성, 금융상품 쉬운 설명, 답변 톤 교정을 수행합니다.\n\n규칙:\n- 공손하고 명확한 공식 어조를 유지합니다.\n- 과도한 사과나 법적 책임 인정으로 해석될 표현, 단정적 수익 보장 표현은 피합니다.\n- 고객이 이해하기 쉬운 표현으로 풀어 설명합니다.",
    tasks: ["이 민원 답변 다듬어줘", "이 상품 쉽게 설명해줘", "정중한 거절 메시지 써줘"],
    author: "최민준", runs: 52, comments: [],
  },
  {
    key: "a103", cat: "작성·요약", name: "업무 자동화 비서",
    desc: "회의록 정리·주간보고 작성·할 일 정리를 자동으로 해주는 업무 비서 에이전트예요.",
    instructions: "당신은 한화투자증권 임직원의 반복 업무를 돕는 AI 비서입니다.\n회의 메모를 받으면 결정사항과 액션아이템(담당자·기한)을 정리하고, 주간 업무 내역을 받으면 팀장 보고 형식으로 요약합니다.\n\n규칙:\n- 한국어로 간결하게 작성합니다.\n- 표가 필요한 경우 표로 정리합니다.\n- 빠진 정보가 있으면 먼저 확인합니다.",
    tasks: ["이 회의 메모 정리해줘", "이번 주 업무 보고서 만들어줘", "할 일 우선순위 정해줘"],
    author: "권다은", runs: 41, comments: [],
  },
];

const VIEWER_SAVED_AGENTS = new Set(["a102"]);

// 관리자 신고 대기 3건 (콘텐츠 관리 flag 상태와 매칭)
const FLAGGED_EXTRA = [
  { title: "고객 리스트 정리 프롬프트", reason: "프롬프트 본문에 실제 고객 이름·연락처로 보이는 정보가 포함돼 있습니다.", author: "미상" },
  { title: "내부 수익률 계산 도우미", reason: "지침에 외부 공개되지 않은 내부 수익률 산식이 노출돼 있습니다.", author: "미상" },
];

async function main() {
  console.log("시딩 시작...");

  // 카테고리
  await db.category.deleteMany({ where: { name: { notIn: [...WORK_CATEGORIES] } } });
  for (let i = 0; i < WORK_CATEGORIES.length; i++) {
    await db.category.upsert({
      where: { name: WORK_CATEGORIES[i] },
      update: { order: i + 1 },
      create: { name: WORK_CATEGORIES[i], order: i + 1 },
    });
  }

  // 사용자
  const userIdByName = new Map<string, string>();
  for (const u of USERS) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, dept: u.dept, role: u.role },
      create: { email: u.email, name: u.name, dept: u.dept, role: u.role },
    });
    userIdByName.set(u.key, user.id);
  }
  const viewer = userIdByName.get("권다은")!;

  // 프롬프트 + 댓글 + 저장(뷰어분)
  const promptIdByKey = new Map<string, string>();
  for (const p of PROMPTS) {
    const authorId = userIdByName.get(p.author);
    if (!authorId) throw new Error(`알 수 없는 작성자: ${p.author}`);
    const prompt = await db.prompt.create({
      data: {
        title: p.title,
        description: p.desc,
        body: p.body,
        category: p.cat,
        official: !!p.official,
        copyCount: p.copies,
        runCount: p.runs,
        authorId,
      },
    });
    promptIdByKey.set(p.key, prompt.id);

    for (const c of p.comments) {
      const cUserId = userIdByName.get(c.author);
      if (!cUserId) throw new Error(`알 수 없는 댓글 작성자: ${c.author}`);
      await db.comment.create({ data: { text: c.text, userId: cUserId, promptId: prompt.id } });
    }

    if (VIEWER_SAVED_PROMPTS.has(p.key)) {
      await db.save.create({ data: { userId: viewer, promptId: prompt.id } });
    }
  }

  // 에이전트 + 댓글 + 저장(뷰어분)
  const agentIdByKey = new Map<string, string>();
  for (const a of AGENTS) {
    const authorId = userIdByName.get(a.author);
    if (!authorId) throw new Error(`알 수 없는 작성자: ${a.author}`);
    const agent = await db.agent.create({
      data: {
        name: a.name,
        description: a.desc,
        instructions: a.instructions,
        exampleTasks: a.tasks,
        category: a.cat,
        runCount: a.runs,
        authorId,
      },
    });
    agentIdByKey.set(a.key, agent.id);

    for (const c of a.comments) {
      const cUserId = userIdByName.get(c.author);
      if (!cUserId) throw new Error(`알 수 없는 댓글 작성자: ${c.author}`);
      await db.comment.create({ data: { text: c.text, userId: cUserId, agentId: agent.id } });
    }

    if (VIEWER_SAVED_AGENTS.has(a.key)) {
      await db.save.create({ data: { userId: viewer, agentId: agent.id } });
    }
  }

  // 활동(알림) — 데모의 권다은 수신 알림 4건 (모두 p3 "주간 업무보고 자동 초안 작성기" 대상)
  const p3Id = promptIdByKey.get("p3")!;
  const notifSeed: { actor: string; type: "comment"; text: string; hoursAgo: number }[] = [
    { actor: "박소영", type: "comment", text: "팀 보고 양식에 맞게 조금 수정해서 잘 쓰고 있어요.", hoursAgo: 2 },
    { actor: "정하은", type: "comment", text: "이슈/리스크 분리해주는 게 보고할 때 편해요!", hoursAgo: 26 },
    { actor: "한지우", type: "comment", text: "회의 결과 정리에도 활용하기 좋습니다.", hoursAgo: 27 },
    { actor: "강태양", type: "comment", text: "주간 업무를 빠르게 분류할 수 있어 유용해요.", hoursAgo: 50 },
  ];
  for (const n of notifSeed) {
    const actorId = userIdByName.get(n.actor);
    if (!actorId) throw new Error(`알 수 없는 알림 발신자: ${n.actor}`);
    await db.notification.create({
      data: {
        type: n.type,
        recipientId: viewer,
        actorId,
        promptId: p3Id,
        commentText: n.text,
        createdAt: new Date(Date.now() - n.hoursAgo * 60 * 60 * 1000),
      },
    });
  }

  // 관리자 콘텐츠 관리 화면의 신고됨(flag) 표본 콘텐츠 — 실제 신고 대상 콘텐츠 2건 생성
  const flaggedAuthor = userIdByName.get("정하은")!; // placeholder author for orphan-ish flagged content
  const flaggedPrompt = await db.prompt.create({
    data: {
      title: FLAGGED_EXTRA[0].title,
      description: "(신고 검수 대상 샘플 콘텐츠)",
      body: "(민감정보 포함 의심으로 신고된 샘플 프롬프트 본문)",
      category: "작성·요약",
      status: "flagged",
      copyCount: 0,
      runCount: 4,
      authorId: flaggedAuthor,
    },
  });
  const flaggedAgent = await db.agent.create({
    data: {
      name: FLAGGED_EXTRA[1].title,
      description: "(신고 검수 대상 샘플 콘텐츠)",
      instructions: "(내부 비공개 수치 노출 의심으로 신고된 샘플 지침)",
      exampleTasks: [],
      category: "작성·요약",
      status: "flagged",
      runCount: 6,
      authorId: flaggedAuthor,
    },
  });

  await db.report.create({
    data: { reason: FLAGGED_EXTRA[0].reason, reporterId: viewer, promptId: flaggedPrompt.id },
  });
  await db.report.create({
    data: { reason: FLAGGED_EXTRA[1].reason, reporterId: viewer, agentId: flaggedAgent.id },
  });
  await db.report.create({
    data: {
      reason: "특정 종목 매수를 단정적으로 권유하는 문구를 생성합니다. 투자 권유 소지가 있습니다.",
      reporterId: viewer,
      promptId: promptIdByKey.get("p5")!,
    },
  });

  // 감사 로그 표본 (관리자 대시보드 표와 매칭)
  const auditSeed: {
    user: string;
    action: "agent_run" | "prompt_run" | "prompt_generate" | "agent_create";
    label: string;
    agentKey?: string;
    promptKey?: string;
    files: number;
    status: "success" | "failure";
    hoursAgo: number;
  }[] = [
    { user: "권다은", action: "agent_run", label: "업무 자동화 비서", agentKey: "a103", files: 2, status: "success", hoursAgo: 1 },
    { user: "박소영", action: "agent_run", label: "리서치 어시스턴트", agentKey: "a101", files: 1, status: "success", hoursAgo: 2 },
    { user: "강태양", action: "prompt_run", label: "종목 리서치 리포트 핵심 요약", promptKey: "p1", files: 0, status: "success", hoursAgo: 3 },
    { user: "강태양", action: "prompt_generate", label: "—", files: 0, status: "success", hoursAgo: 4 },
    { user: "최민준", action: "agent_create", label: "고객 응대 도우미", files: 0, status: "success", hoursAgo: 6 },
    { user: "윤서연", action: "agent_run", label: "리서치 어시스턴트", agentKey: "a101", files: 3, status: "failure", hoursAgo: 24 },
    { user: "정하은", action: "prompt_generate", label: "—", files: 0, status: "success", hoursAgo: 26 },
    { user: "박소영", action: "agent_run", label: "리서치 어시스턴트", agentKey: "a101", files: 1, status: "success", hoursAgo: 30 },
  ];
  for (const a of auditSeed) {
    const uid = userIdByName.get(a.user)!;
    await db.auditLog.create({
      data: {
        userId: uid,
        action: a.action,
        targetType: a.agentKey ? "agent" : a.promptKey ? "prompt" : null,
        targetId: a.agentKey
          ? agentIdByKey.get(a.agentKey) ?? null
          : a.promptKey
            ? promptIdByKey.get(a.promptKey) ?? null
            : null,
        targetLabel: a.label,
        fileCount: a.files,
        status: a.status,
        createdAt: new Date(Date.now() - a.hoursAgo * 60 * 60 * 1000),
      },
    });
  }

  // 사용량 로그 표본 (관리자 사용량·비용 집계 원천)
  const usageSeed: { user: string; feature: string; cost: number; hoursAgo: number }[] = [
    { user: "박소영", feature: "agent_run", cost: 0.08, hoursAgo: 2 },
    { user: "강태양", feature: "prompt_generate", cost: 0.02, hoursAgo: 4 },
    { user: "최민준", feature: "agent_generate", cost: 0.03, hoursAgo: 6 },
    { user: "윤서연", feature: "agent_run", cost: 0.09, hoursAgo: 24 },
  ];
  for (const u of usageSeed) {
    const uid = userIdByName.get(u.user)!;
    await db.usageLog.create({
      data: { userId: uid, feature: u.feature, costUsd: u.cost, createdAt: new Date(Date.now() - u.hoursAgo * 60 * 60 * 1000) },
    });
  }

  // 설정 (민감정보 필터 키워드, 등록 경고 문구, 전역 호출 한도, 부서별 인원수)
  await db.setting.upsert({
    where: { key: "sensitive_keywords" },
    update: { value: ["고객정보", "주민번호", "계좌번호", "내부수익률", "비공개"] },
    create: { key: "sensitive_keywords", value: ["고객정보", "주민번호", "계좌번호", "내부수익률", "비공개"] },
  });
  await db.setting.upsert({
    where: { key: "dept_headcount" },
    update: { value: { "AI Roll-up TFT": 8, "리서치센터": 24, "컴플라이언스": 14, "WM영업": 30, "해외주식": 12 } },
    create: { key: "dept_headcount", value: { "AI Roll-up TFT": 8, "리서치센터": 24, "컴플라이언스": 14, "WM영업": 30, "해외주식": 12 } },
  });
  await db.setting.upsert({
    where: { key: "registration_warning" },
    update: { value: "실제 고객정보, 내부 비공개 수치, 계좌·주민번호 등 민감정보는 절대 입력하지 마세요." },
    create: { key: "registration_warning", value: "실제 고객정보, 내부 비공개 수치, 계좌·주민번호 등 민감정보는 절대 입력하지 마세요." },
  });
  await db.setting.upsert({
    where: { key: "global_daily_call_limit" },
    update: { value: 5000 },
    create: { key: "global_daily_call_limit", value: 5000 },
  });
  await db.setting.upsert({
    where: { key: "per_user_daily_call_limit" },
    update: { value: 100 },
    create: { key: "per_user_daily_call_limit", value: 100 },
  });

  console.log(`시딩 완료: 사용자 ${USERS.length}명, 프롬프트 ${PROMPTS.length + 1}건, 에이전트 ${AGENTS.length + 1}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
