// design-reference/prompthub-demo_v16.html · prompthub-admin.html 의 데모 데이터를 DB로 이관.
import { PrismaClient } from "@prisma/client";
import { WORK_CATEGORIES, type WorkCategory } from "../src/lib/work-categories";
import { serializeAgentExampleTasks } from "../src/lib/agent-example-tasks";

const db = new PrismaClient();

// 관리자 사용자·권한 표 + 프롬프트 작성자 기준.
// 권다은 = 실제 로그인 테스트 계정(202502035@hanwha.com) 본인. 나머지는 admin 표의
// {given}.{family}@hanwha.com 패턴을 따르는 시드 전용 동료 계정.
type SeedUser = {
  key: string;
  email: string;
  name: string;
  dept: string;
  role: "admin" | "mod" | "user";
};

const CORE_USERS: SeedUser[] = [
  { key: "권다은", email: "202502035@hanwha.com", name: "권다은", dept: "AI Roll-up TFT", role: "user" as const },
  { key: "박소영", email: "soyoung.park@hanwha.com", name: "박소영", dept: "리서치센터", role: "mod" as const },
  { key: "최민준", email: "minjun.choi@hanwha.com", name: "최민준", dept: "컴플라이언스", role: "mod" as const },
  { key: "강태양", email: "taeyang.kang@hanwha.com", name: "강태양", dept: "WM영업", role: "user" as const },
  { key: "윤서연", email: "seoyeon.yoon@hanwha.com", name: "윤서연", dept: "해외주식", role: "user" as const },
  { key: "정하은", email: "haeun.jung@hanwha.com", name: "정하은", dept: "전략기획", role: "user" as const },
  { key: "한지우", email: "jiwoo.han@hanwha.com", name: "한지우", dept: "리서치센터", role: "user" as const },
  { key: "이도현", email: "dohyun.lee@hanwha.com", name: "이도현", dept: "WM영업", role: "user" as const },
  { key: "김유진", email: "yujin.kim@hanwha.com", name: "김유진", dept: "디지털전략", role: "user" as const },
  { key: "오세훈", email: "sehun.oh@hanwha.com", name: "오세훈", dept: "경영지원", role: "user" as const },
  { key: "배지훈", email: "jihun.bae@hanwha.com", name: "배지훈", dept: "IB사업", role: "user" as const },
  { key: "송예린", email: "yerin.song@hanwha.com", name: "송예린", dept: "리스크관리", role: "user" as const },
];

const DEPT_HEADCOUNTS: Record<string, number> = {
  "AI Roll-up TFT": 8,
  "리서치센터": 24,
  "컴플라이언스": 14,
  "WM영업": 30,
  "해외주식": 12,
  "전략기획": 18,
  "디지털전략": 22,
  "경영지원": 7,
  "IB사업": 27,
};
const UNREGISTERED_DEPT = "리스크관리";
const UNREGISTERED_DEPT_SIZE = 16;

// 부서별 실제 사용자 수도 5~30명 범위에 맞춘다. 핵심 데모 계정 외 사용자는 시드 전용 가상 계정이다.
const USERS: SeedUser[] = [...CORE_USERS];
let mockUserSerial = 1;
for (const [dept, headcount] of Object.entries({ ...DEPT_HEADCOUNTS, [UNREGISTERED_DEPT]: UNREGISTERED_DEPT_SIZE })) {
  const existingCount = USERS.filter((user) => user.dept === dept).length;
  for (let index = existingCount; index < headcount; index += 1) {
    const serial = String(mockUserSerial).padStart(3, "0");
    USERS.push({
      key: `${dept}-seed-${serial}`,
      email: `seed.mock.${serial}@hanwha.com`,
      name: `${dept} 구성원 ${index + 1}`,
      dept,
      role: "user",
    });
    mockUserSerial += 1;
  }
}

function daysAgoAt(dayOffset: number, hour = 10, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// 월별 추이와 7/30/90일 기간 필터를 함께 검증할 수 있도록 등록일을 분산한다.
const PROMPT_CREATED_DAYS_AGO: Record<string, number> = {
  p10: 2, p1: 118, p2: 75, p3: 42, p4: 155, p5: 24, p6: 92, p7: 61, p8: 13, p9: 5,
  p11: 83, p12: 34, p13: 18, p14: 132,
};

const AGENT_CREATED_DAYS_AGO: Record<string, number> = {
  a101: 145, a102: 68, a103: 4, a104: 87, a105: 39, a106: 21, a107: 109,
};

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
  {
    key: "p11", cat: "분석", title: "포트폴리오 위험 요인 분석",
    desc: "보유 자산과 비중을 입력하면 집중도와 주요 위험 요인을 점검하고 확인할 항목을 정리합니다.",
    body: "아래 포트폴리오를 자산군·업종·국가별로 나눠 집중도를 분석하고, 변동성 확대 시 확인할 위험 요인을 표로 정리해주세요. 수익률을 예측하거나 특정 매매를 권유하지 마세요.\n\n포트폴리오: {{보유자산과 비중}}",
    author: "송예린", copies: 73, runs: 38, comments: [],
  },
  {
    key: "p12", cat: "기획·아이디어", title: "신규 서비스 아이디어 구조화",
    desc: "초기 아이디어를 고객 문제·가치 제안·검증 방법 중심의 기획 초안으로 구조화합니다.",
    body: "아래 아이디어를 고객 문제, 목표 사용자, 핵심 가치, 가설, 2주 안에 가능한 검증 방법으로 나눠 기획 초안을 작성해주세요. 불명확한 가정은 별도로 표시해주세요.\n\n아이디어: {{아이디어}}",
    author: "정하은", copies: 48, runs: 27, comments: [],
  },
  {
    key: "p13", cat: "자동화·개발", title: "엑셀 수식 오류 점검 도우미",
    desc: "엑셀 수식과 기대 결과를 입력하면 오류 원인과 수정 수식을 단계별로 설명합니다.",
    body: "아래 엑셀 수식이 기대 결과와 다른 이유를 찾아주세요. 참조 범위, 절대·상대 참조, 데이터 형식을 확인하고 수정 수식과 검증 절차를 제시해주세요.\n\n수식: {{수식}}\n기대 결과: {{기대결과}}",
    author: "김유진", copies: 57, runs: 31, comments: [],
  },
  {
    key: "p14", cat: "번역·검토", title: "해외 규정 변경사항 비교 검토",
    desc: "영문 규정 개정 전후 문안을 비교해 변경점과 실무 영향을 한국어로 정리합니다.",
    body: "아래 영문 규정의 개정 전후 문안을 비교해 추가·삭제·변경된 내용을 표로 정리하고, 국내 실무에 미칠 수 있는 영향을 사실과 검토 필요 사항으로 구분해주세요.\n\n개정 전: {{이전문안}}\n개정 후: {{개정문안}}",
    author: "윤서연", copies: 35, runs: 19, comments: [],
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
  {
    key: "a104", cat: "분석", name: "리스크 시나리오 분석가",
    desc: "시장·운영 리스크 시나리오를 입력하면 영향 범위와 대응 점검표를 정리하는 에이전트예요.",
    instructions: "당신은 금융회사의 리스크 분석 보조 에이전트입니다. 입력된 시나리오의 전제, 영향 경로, 관찰 지표, 완화 조치를 구분해 정리합니다. 근거 없는 수치 예측은 하지 않고 추가 확인이 필요한 데이터는 명시합니다.",
    tasks: ["금리 급등 시나리오 분석해줘", "운영 중단 영향 경로를 정리해줘", "대응 점검표를 만들어줘"],
    author: "송예린", runs: 46, comments: [],
  },
  {
    key: "a105", cat: "기획·아이디어", name: "서비스 기획 코치",
    desc: "아이디어를 사용자 흐름과 검증 계획으로 구체화하는 기획 지원 에이전트예요.",
    instructions: "당신은 사내 서비스 기획을 돕는 코치입니다. 아이디어를 사용자 문제, 핵심 사용자 흐름, 화면 요구사항, 검증 질문으로 구조화합니다. 확인되지 않은 가정은 사실처럼 단정하지 않습니다.",
    tasks: ["아이디어를 사용자 흐름으로 바꿔줘", "PoC 검증 질문을 만들어줘", "화면 요구사항을 정리해줘"],
    author: "정하은", runs: 34, comments: [],
  },
  {
    key: "a106", cat: "자동화·개발", name: "반복업무 자동화 설계자",
    desc: "반복 업무를 단계별로 분해하고 안전한 자동화 후보를 찾는 에이전트예요.",
    instructions: "당신은 사내 반복 업무 자동화 설계자입니다. 현재 절차를 입력받아 입력·처리·검수·출력 단계로 분해하고, 자동화 가능 구간과 반드시 사람이 확인할 구간을 구분합니다. 외부 전송이나 보안 우회는 제안하지 않습니다.",
    tasks: ["이 업무를 자동화 단계로 나눠줘", "사람이 검수할 지점을 표시해줘", "간단한 자동화 명세를 써줘"],
    author: "김유진", runs: 43, comments: [],
  },
  {
    key: "a107", cat: "번역·검토", name: "글로벌 뉴스 브리핑 도우미",
    desc: "영문 시장 뉴스를 번역하고 사실·전망·주의점을 구분해 브리핑하는 에이전트예요.",
    instructions: "당신은 글로벌 시장 뉴스 브리핑 보조 에이전트입니다. 원문의 사실, 인용된 전망, 작성자의 해석을 구분해 한국어로 정리합니다. 원문에 없는 결론을 추가하지 않고 숫자와 고유명사는 재검토합니다.",
    tasks: ["이 뉴스를 아침 브리핑으로 정리해줘", "사실과 전망을 구분해줘", "숫자와 번역을 검토해줘"],
    author: "윤서연", runs: 29, comments: [],
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

  const seededDepartmentCounts = USERS.reduce<Record<string, number>>((counts, user) => {
    counts[user.dept] = (counts[user.dept] ?? 0) + 1;
    return counts;
  }, {});
  if (Object.keys(seededDepartmentCounts).length < 8 || Object.values(seededDepartmentCounts).some((count) => count < 5 || count > 30)) {
    throw new Error("Phase 6 시드 검증 실패: 부서는 8개 이상, 부서별 사용자는 5~30명이어야 합니다.");
  }
  if (DEPT_HEADCOUNTS[UNREGISTERED_DEPT] !== undefined) {
    throw new Error("Phase 6 시드 검증 실패: 인원수 미등록 부서를 1개 이상 남겨야 합니다.");
  }

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
        createdAt: daysAgoAt(PROMPT_CREATED_DAYS_AGO[p.key] ?? 0, 9, 30),
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
        exampleTasks: serializeAgentExampleTasks(a.tasks),
        category: a.cat,
        runCount: a.runs,
        authorId,
        createdAt: daysAgoAt(AGENT_CREATED_DAYS_AGO[a.key] ?? 0, 11, 0),
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
      category: "자동화·개발",
      status: "flagged",
      copyCount: 0,
      runCount: 4,
      authorId: flaggedAuthor,
      createdAt: daysAgoAt(47, 14, 0),
    },
  });
  const flaggedAgent = await db.agent.create({
    data: {
      name: FLAGGED_EXTRA[1].title,
      description: "(신고 검수 대상 샘플 콘텐츠)",
      instructions: "(내부 비공개 수치 노출 의심으로 신고된 샘플 지침)",
      exampleTasks: serializeAgentExampleTasks([]),
      category: "분석",
      status: "flagged",
      runCount: 6,
      authorId: flaggedAuthor,
      createdAt: daysAgoAt(29, 15, 0),
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

  // 최근 180일 실행 로그. 동일 콘텐츠를 여러 부서가 활용하는 시나리오를 반복해
  // 콘텐츠별 실행 부서 수와 타 부서 실행 수가 대시보드에서 뚜렷하게 보이게 한다.
  type RunScenario = { user: string; targetType: "prompt" | "agent"; targetKey: string };
  const runScenarios: RunScenario[] = [
    // 리서치센터 콘텐츠를 전사 여러 부서가 활용하는 대표 확산 사례
    { user: "강태양", targetType: "prompt", targetKey: "p1" },
    { user: "윤서연", targetType: "prompt", targetKey: "p1" },
    { user: "정하은", targetType: "prompt", targetKey: "p1" },
    { user: "배지훈", targetType: "prompt", targetKey: "p1" },
    { user: "박소영", targetType: "prompt", targetKey: "p1" },
    // AI Roll-up TFT의 업무 자동화 비서를 타 부서가 가져다 쓰는 사례
    { user: "김유진", targetType: "agent", targetKey: "a103" },
    { user: "최민준", targetType: "agent", targetKey: "a103" },
    { user: "오세훈", targetType: "agent", targetKey: "a103" },
    { user: "이도현", targetType: "agent", targetKey: "a103" },
    { user: "권다은", targetType: "agent", targetKey: "a103" },
    // 컴플라이언스 콘텐츠의 영업·지원·리스크 부서 확산
    { user: "강태양", targetType: "prompt", targetKey: "p2" },
    { user: "오세훈", targetType: "prompt", targetKey: "p2" },
    { user: "송예린", targetType: "prompt", targetKey: "p2" },
    { user: "최민준", targetType: "prompt", targetKey: "p2" },
    // 나머지 업무유형도 Prompt와 Agent 양쪽에서 타 부서 실행이 발생하도록 구성
    { user: "김유진", targetType: "prompt", targetKey: "p7" },
    { user: "오세훈", targetType: "prompt", targetKey: "p7" },
    { user: "한지우", targetType: "prompt", targetKey: "p7" },
    { user: "정하은", targetType: "agent", targetKey: "a104" },
    { user: "배지훈", targetType: "agent", targetKey: "a104" },
    { user: "송예린", targetType: "agent", targetKey: "a104" },
    { user: "박소영", targetType: "agent", targetKey: "a105" },
    { user: "윤서연", targetType: "agent", targetKey: "a105" },
    { user: "최민준", targetType: "agent", targetKey: "a106" },
    { user: "권다은", targetType: "agent", targetKey: "a106" },
    { user: "김유진", targetType: "agent", targetKey: "a106" },
    { user: "이도현", targetType: "agent", targetKey: "a107" },
    { user: "배지훈", targetType: "agent", targetKey: "a107" },
    { user: "윤서연", targetType: "agent", targetKey: "a107" },
    { user: "권다은", targetType: "prompt", targetKey: "p11" },
    { user: "한지우", targetType: "prompt", targetKey: "p11" },
    { user: "송예린", targetType: "prompt", targetKey: "p11" },
  ];

  const userSeedByName = new Map(USERS.map((user) => [user.key, user]));
  const usersByDept = new Map<string, SeedUser[]>();
  for (const user of USERS) {
    const departmentUsers = usersByDept.get(user.dept) ?? [];
    departmentUsers.push(user);
    usersByDept.set(user.dept, departmentUsers);
  }
  const promptSeedByKey = new Map(PROMPTS.map((prompt) => [prompt.key, prompt]));
  const agentSeedByKey = new Map(AGENTS.map((agent) => [agent.key, agent]));
  const runAuditRows: {
    userId: string;
    action: "prompt_run" | "agent_run";
    targetType: "prompt" | "agent";
    targetId: string;
    targetLabel: string;
    fileCount: number;
    status: "success";
    createdAt: Date;
  }[] = [];
  let crossDeptRunCount = 0;

  for (let dayOffset = 179; dayOffset >= 0; dayOffset -= 1) {
    const date = daysAgoAt(dayOffset);
    const runsToday = [0, 6].includes(date.getDay()) ? 1 : 3;
    for (let runIndex = 0; runIndex < runsToday; runIndex += 1) {
      const scenario = runScenarios[(dayOffset * 3 + runIndex * 7) % runScenarios.length];
      const scenarioRunner = userSeedByName.get(scenario.user);
      const runnerCandidates = scenarioRunner ? usersByDept.get(scenarioRunner.dept) : null;
      const runner = runnerCandidates?.[(dayOffset + runIndex) % runnerCandidates.length];
      const userId = runner ? userIdByName.get(runner.key) : null;
      const content = scenario.targetType === "prompt"
        ? promptSeedByKey.get(scenario.targetKey)
        : agentSeedByKey.get(scenario.targetKey);
      const targetId = scenario.targetType === "prompt"
        ? promptIdByKey.get(scenario.targetKey)
        : agentIdByKey.get(scenario.targetKey);
      const owner = content ? userSeedByName.get(content.author) : null;
      if (!runner || !userId || !content || !targetId || !owner) {
        throw new Error(`실행 시나리오 연결 실패: ${scenario.user} → ${scenario.targetType}/${scenario.targetKey}`);
      }
      if (runner.dept !== owner.dept) crossDeptRunCount += 1;

      runAuditRows.push({
        userId,
        action: scenario.targetType === "prompt" ? "prompt_run" : "agent_run",
        targetType: scenario.targetType,
        targetId,
        targetLabel: "title" in content ? content.title : content.name,
        fileCount: scenario.targetType === "agent" ? (dayOffset + runIndex) % 3 : 0,
        status: "success",
        createdAt: daysAgoAt(dayOffset, 9 + ((dayOffset + runIndex) % 9), (runIndex * 17) % 60),
      });
    }
  }
  if (runAuditRows.length < 150 || crossDeptRunCount / runAuditRows.length < 0.75) {
    throw new Error("Phase 6 시드 검증 실패: 타 부서 실행 사례가 충분하지 않습니다.");
  }

  const operationalAuditRows = [
    { userId: userIdByName.get("강태양")!, action: "prompt_generate" as const, targetType: null, targetId: null, targetLabel: "—", fileCount: 0, status: "success" as const, createdAt: daysAgoAt(0, 9, 10) },
    { userId: userIdByName.get("최민준")!, action: "agent_create" as const, targetType: "agent", targetId: agentIdByKey.get("a102")!, targetLabel: "고객 응대 도우미", fileCount: 0, status: "success" as const, createdAt: daysAgoAt(0, 11, 20) },
    { userId: userIdByName.get("정하은")!, action: "agent_generate" as const, targetType: null, targetId: null, targetLabel: "—", fileCount: 0, status: "success" as const, createdAt: daysAgoAt(1, 14, 30) },
  ];
  await db.auditLog.createMany({ data: [...runAuditRows, ...operationalAuditRows] });

  // 관리자 사용량·비용 화면도 기간별 변화를 확인할 수 있도록 생성 호출을 90일에 분산한다.
  const usageRows: { userId: string; feature: string; costUsd: number; createdAt: Date }[] = [];
  for (let dayOffset = 89; dayOffset >= 0; dayOffset -= 1) {
    const date = daysAgoAt(dayOffset);
    if ([0, 6].includes(date.getDay())) continue;
    const callsToday = dayOffset < 30 ? 2 : 1;
    for (let callIndex = 0; callIndex < callsToday; callIndex += 1) {
      const user = USERS[(dayOffset + callIndex * 5) % USERS.length];
      usageRows.push({
        userId: userIdByName.get(user.key)!,
        feature: (dayOffset + callIndex) % 3 === 0 ? "agent_generate" : "prompt_generate",
        costUsd: Math.round((0.012 + ((dayOffset + callIndex) % 7) * 0.004) * 1000) / 1000,
        createdAt: daysAgoAt(dayOffset, 10 + callIndex * 4, (dayOffset * 7) % 60),
      });
    }
  }
  await db.usageLog.createMany({ data: usageRows });

  // 사용자 관리 화면의 최근 활동 시각도 생성된 실행 기록과 일치시킨다.
  for (const user of USERS) {
    const userId = userIdByName.get(user.key)!;
    const lastRun = runAuditRows
      .filter((row) => row.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (lastRun) {
      await db.user.update({ where: { id: userId }, data: { lastActiveAt: lastRun.createdAt } });
    }
  }

  // 설정 (민감정보 필터 키워드, 등록 경고 문구, 전역 호출 한도, 부서별 인원수)
  await db.setting.upsert({
    where: { key: "sensitive_keywords" },
    update: { value: ["고객정보", "주민번호", "계좌번호", "내부수익률", "비공개"] },
    create: { key: "sensitive_keywords", value: ["고객정보", "주민번호", "계좌번호", "내부수익률", "비공개"] },
  });
  await db.setting.upsert({
    where: { key: "dept_headcount" },
    // 리스크관리는 의도적으로 제외해 공개 대시보드의 비율 미표시(null) 상태를 검증한다.
    update: { value: DEPT_HEADCOUNTS },
    create: { key: "dept_headcount", value: DEPT_HEADCOUNTS },
  });
  await db.setting.upsert({
    where: { key: "ai_subscription_reference_month" },
    update: { value: "2026-08" },
    create: { key: "ai_subscription_reference_month", value: "2026-08" },
  });
  const subscriptionRows = [
    { dept: "리서치센터", tool: "Claude", accounts: 8, monthlyCostKrw: 240000 },
    { dept: "WM영업", tool: "Claude", accounts: 6, monthlyCostKrw: 180000 },
    { dept: "컴플라이언스", tool: "Microsoft Copilot", accounts: 4, monthlyCostKrw: 120000 },
    { dept: "해외주식", tool: "ChatGPT", accounts: 5, monthlyCostKrw: 150000 },
    { dept: "전략기획", tool: "Claude", accounts: 3, monthlyCostKrw: 90000 },
  ];
  await db.setting.upsert({
    where: { key: "ai_subscription_by_dept" },
    update: { value: subscriptionRows },
    create: { key: "ai_subscription_by_dept", value: subscriptionRows },
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

  const categoryCounts = [...PROMPTS, ...AGENTS].reduce<Record<string, number>>((counts, content) => {
    counts[content.cat] = (counts[content.cat] ?? 0) + 1;
    return counts;
  }, {});
  if (WORK_CATEGORIES.some((category) => !categoryCounts[category])) {
    throw new Error("Phase 6 시드 검증 실패: 6개 업무 카테고리에 콘텐츠가 모두 필요합니다.");
  }
  console.log(`시딩 완료: 사용자 ${USERS.length}명 / 부서 ${new Set(USERS.map((user) => user.dept)).size}개`);
  console.log(`콘텐츠: 프롬프트 ${PROMPTS.length + 1}건 / 에이전트 ${AGENTS.length + 1}건 / 카테고리 ${JSON.stringify(categoryCounts)}`);
  console.log(`최근 180일 실행: ${runAuditRows.length}건 (타 부서 실행 ${crossDeptRunCount}건) / 생성 호출: ${usageRows.length}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
