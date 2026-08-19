// 사내 시연용 현실화 시드 원본. 디자인 레퍼런스의 업무 맥락은 유지하되 사용자·활동 분포는 실제 규모에 맞춘다.
// 개인 활동이 한 계정에 몰리지 않도록 팀별 구성원과 최근 실행 목표를 함께 관리한다.
import type { RunType, TimeBand } from "@prisma/client";
import { CATEGORIES } from "../src/lib/categories";

export { CATEGORIES };
type Category = (typeof CATEGORIES)[number];

// 목업 shot() — 산출물 스크린샷 자리를 채우는 더미 SVG. 실제 이미지 업로드는 별도 과제.
export function shot(kind: "table" | "chart" | "chat" | "doc", title: string): string {
  const body: Record<string, string> = {
    table:
      '<rect x="20" y="52" width="280" height="24" fill="#F0EDE7"/><rect x="20" y="84" width="280" height="1" fill="#E7E4DE"/><rect x="20" y="100" width="280" height="1" fill="#E7E4DE"/><rect x="20" y="116" width="280" height="1" fill="#E7E4DE"/><rect x="20" y="132" width="280" height="1" fill="#E7E4DE"/><rect x="228" y="88" width="52" height="9" rx="3" fill="#D96A28" opacity=".5"/>',
    chart:
      '<rect x="30" y="120" width="30" height="45" fill="#E8C4A8"/><rect x="72" y="92" width="30" height="73" fill="#D96A28"/><rect x="114" y="108" width="30" height="57" fill="#E8C4A8"/><rect x="156" y="70" width="30" height="95" fill="#D96A28"/><rect x="198" y="130" width="30" height="35" fill="#E8C4A8"/><line x1="24" y1="166" x2="296" y2="166" stroke="#D8D4CC" stroke-width="2"/>',
    chat: '<rect x="20" y="52" width="152" height="30" rx="9" fill="#F0EDE7"/><rect x="128" y="92" width="172" height="40" rx="9" fill="#FAF0E8"/><rect x="20" y="142" width="200" height="30" rx="9" fill="#F0EDE7"/>',
    doc: '<rect x="20" y="52" width="118" height="10" rx="3" fill="#D96A28" opacity=".55"/><rect x="20" y="74" width="280" height="8" rx="3" fill="#E7E4DE"/><rect x="20" y="90" width="280" height="8" rx="3" fill="#E7E4DE"/><rect x="20" y="106" width="232" height="8" rx="3" fill="#E7E4DE"/><rect x="20" y="130" width="98" height="10" rx="3" fill="#D96A28" opacity=".55"/><rect x="20" y="150" width="280" height="8" rx="3" fill="#E7E4DE"/>',
  };
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="190" viewBox="0 0 320 190">' +
    '<rect width="320" height="190" fill="#FFFFFF"/><rect width="320" height="34" fill="#F7F6F3"/>' +
    '<circle cx="18" cy="17" r="4" fill="#E0DCD4"/><circle cx="32" cy="17" r="4" fill="#E0DCD4"/><circle cx="46" cy="17" r="4" fill="#E0DCD4"/>' +
    `<text x="62" y="21" font-family="sans-serif" font-size="11" fill="#9C9B95">${title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>` +
    body[kind] +
    '<rect x="1" y="1" width="318" height="188" fill="none" stroke="#E7E4DE" stroke-width="2"/></svg>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// 권다은 = 실제 로그인 테스트 계정. 나머지는 {given}.{family}@hanwha.com 패턴의 시드 전용 동료 계정.
export const USERS = [
  { name: "권다은", email: "202502035@hanwha.com", dept: "플랫폼개발팀", role: "user" as const },
  { name: "서가람", email: "garam.seo@hanwha.com", dept: "플랫폼개발팀", role: "mod" as const },
  { name: "문예준", email: "yejun.moon@hanwha.com", dept: "플랫폼개발팀", role: "user" as const },
  { name: "오세빈", email: "sebin.oh@hanwha.com", dept: "플랫폼개발팀", role: "user" as const },
  { name: "배하람", email: "haram.bae@hanwha.com", dept: "플랫폼개발팀", role: "user" as const },
  { name: "박소영", email: "soyoung.park@hanwha.com", dept: "디지털L&D센터", role: "mod" as const },
  { name: "한지우", email: "jiwoo.han@hanwha.com", dept: "디지털L&D센터", role: "user" as const },
  { name: "노유진", email: "yujin.noh@hanwha.com", dept: "디지털L&D센터", role: "user" as const },
  { name: "진서율", email: "seoyul.jin@hanwha.com", dept: "디지털L&D센터", role: "user" as const },
  { name: "임도윤", email: "doyoon.lim@hanwha.com", dept: "디지털L&D센터", role: "user" as const },
  { name: "최민준", email: "minjun.choi@hanwha.com", dept: "법무팀", role: "mod" as const },
  { name: "고은채", email: "eunchae.ko@hanwha.com", dept: "법무팀", role: "user" as const },
  { name: "류선우", email: "sunwoo.ryu@hanwha.com", dept: "법무팀", role: "user" as const },
  { name: "안시현", email: "sihyun.ahn@hanwha.com", dept: "법무팀", role: "user" as const },
  { name: "조하린", email: "harin.cho@hanwha.com", dept: "법무팀", role: "user" as const },
  { name: "이도현", email: "dohyun.lee@hanwha.com", dept: "WM추진팀", role: "user" as const },
  { name: "남우진", email: "woojin.nam@hanwha.com", dept: "WM추진팀", role: "mod" as const },
  { name: "백예린", email: "yerin.baek@hanwha.com", dept: "WM추진팀", role: "user" as const },
  { name: "신유나", email: "yuna.shin@hanwha.com", dept: "WM추진팀", role: "user" as const },
  { name: "황지호", email: "jiho.hwang@hanwha.com", dept: "WM추진팀", role: "user" as const },
  { name: "윤서연", email: "seoyeon.yoon@hanwha.com", dept: "해외주식팀", role: "user" as const },
  { name: "도지안", email: "jian.do@hanwha.com", dept: "해외주식팀", role: "mod" as const },
  { name: "마서현", email: "seohyun.ma@hanwha.com", dept: "해외주식팀", role: "user" as const },
  { name: "송재윤", email: "jaeyoon.song@hanwha.com", dept: "해외주식팀", role: "user" as const },
  { name: "표은호", email: "eunho.pyo@hanwha.com", dept: "해외주식팀", role: "user" as const },
  { name: "정하은", email: "haeun.jung@hanwha.com", dept: "디지털상품기획팀", role: "user" as const },
  { name: "김로아", email: "roa.kim@hanwha.com", dept: "디지털상품기획팀", role: "mod" as const },
  { name: "민재하", email: "jaeha.min@hanwha.com", dept: "디지털상품기획팀", role: "user" as const },
  { name: "서이안", email: "ian.seo@hanwha.com", dept: "디지털상품기획팀", role: "user" as const },
  { name: "유태린", email: "taerin.yoo@hanwha.com", dept: "디지털상품기획팀", role: "user" as const },
  { name: "강태양", email: "taeyang.kang@hanwha.com", dept: "연금기획팀", role: "user" as const },
  { name: "공서진", email: "seojin.gong@hanwha.com", dept: "연금기획팀", role: "mod" as const },
  { name: "나예원", email: "yewon.na@hanwha.com", dept: "연금기획팀", role: "user" as const },
  { name: "오현서", email: "hyunseo.oh@hanwha.com", dept: "연금기획팀", role: "user" as const },
  { name: "장도하", email: "doha.jang@hanwha.com", dept: "연금기획팀", role: "user" as const },
  { name: "구지민", email: "jimin.koo@hanwha.com", dept: "상품전략팀", role: "mod" as const },
  { name: "라은우", email: "eunwoo.ra@hanwha.com", dept: "상품전략팀", role: "user" as const },
  { name: "문서하", email: "seoha.moon@hanwha.com", dept: "상품전략팀", role: "user" as const },
  { name: "변지후", email: "jihoo.byun@hanwha.com", dept: "상품전략팀", role: "user" as const },
  { name: "차예나", email: "yena.cha@hanwha.com", dept: "상품전략팀", role: "user" as const },
  { name: "강유찬", email: "yuchan.kang@hanwha.com", dept: "IB1팀", role: "mod" as const },
  { name: "노채원", email: "chaewon.noh@hanwha.com", dept: "IB1팀", role: "user" as const },
  { name: "배준서", email: "junseo.bae@hanwha.com", dept: "IB1팀", role: "user" as const },
  { name: "신도연", email: "doyeon.shin@hanwha.com", dept: "IB1팀", role: "user" as const },
  { name: "윤시우", email: "siwoo.yoon@hanwha.com", dept: "IB1팀", role: "user" as const },
  { name: "권아린", email: "arin.kwon@hanwha.com", dept: "경영관리팀", role: "mod" as const },
  { name: "김태오", email: "taeo.kim@hanwha.com", dept: "경영관리팀", role: "user" as const },
  { name: "박다온", email: "daon.park@hanwha.com", dept: "경영관리팀", role: "user" as const },
  { name: "이수민", email: "sumin.lee@hanwha.com", dept: "경영관리팀", role: "user" as const },
  { name: "정유건", email: "yugeon.jung@hanwha.com", dept: "경영관리팀", role: "user" as const },
];

export type ReviewSeed = {
  author: string;
  daysAgo: number;
  useCase: string;
  effect: string;
  timeBefore: TimeBand | null;
  timeAfter: TimeBand | null;
};

export type AgentSeed = {
  key: string;
  cat: Category;
  name: string;
  daysAgo: number;
  desc: string;
  author: string;
  runs: number;
  official?: boolean;
  runType: RunType;
  trigger: string;
  targetTask: string;
  tasks: string[];
  tools: string[];
  effect: string;
  timeBefore: TimeBand | null;
  timeAfter: TimeBand | null;
  prerequisites: string[];
  howToUse: string[];
  instructions: string;
  linkUrl: string | null;
  outputs: { src: string; caption: string }[];
  reviews: ReviewSeed[];
};

export const AGENTS: AgentSeed[] = [
  {
    key: "a1",
    cat: "조사·수집",
    name: "리서치 브리핑 자동 발송 에이전트",
    daysAgo: 9,
    desc: "매일 새벽에 리서치 포털을 스스로 돌며 전날 신규 리포트를 모아 팀 브리핑을 만들어 메일로 보냅니다.",
    author: "박소영",
    runs: 38,
    official: true,
    runType: "schedule",
    trigger: "매일 오전 06:30 (평일)",
    targetTask:
      "아침 리서치 회의 전에 전날 나온 국내외 리포트를 훑고 팀 브리핑을 만드는 업무입니다.\n담당자가 포털 세 곳을 각각 열어 신규 리포트를 찾고, PDF를 내려받아 읽고, 메일로 정리해 보냈습니다. 담당자가 휴가면 그날 브리핑은 아예 없었습니다.",
    tasks: [
      "포털 3곳에서 전날 신규 리포트를 스스로 수집",
      "같은 종목 리포트를 묶고 투자의견이 갈리는 건 표시",
      "의견·목표가가 바뀐 건을 맨 위로 올려 브리핑 작성",
      "오전 7시 팀 메일 발송, 실패하면 재시도",
    ],
    tools: ["사내 리서치 포털 (조회)", "외부 리서치 RSS 3종", "사내 메일 (발송)", "팀 Teams 채널"],
    effect:
      "담당자가 매일 아침 1시간 30분씩 쓰던 일이 사라졌습니다. 이제는 받은 브리핑을 5분 훑어보는 게 전부입니다.\n무엇보다 담당자 휴가나 출장과 상관없이 매일 같은 시각에 브리핑이 나옵니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: [
      "사내 리서치 포털 계정 (조회 권한)",
      "메일 발송용 사내 계정",
      "에이전트를 상시 켜둘 PC 또는 사내 서버 (IT기획팀에 신청)",
    ],
    howToUse: [
      "아래 [바로가기]의 사내 Git 저장소에서 research-briefing 폴더를 내려받아 압축을 풉니다.",
      "config.yaml 파일을 메모장으로 열고, 브리핑 받을 메일 주소와 관심 섹터만 바꿔 저장합니다.",
      "같은 폴더의 setup 파일을 더블클릭합니다. 처음 한 번만 하면 됩니다.",
      "포털 로그인 창이 뜨면 사내 계정으로 로그인합니다. 이후에는 자동으로 유지됩니다.",
      "다음 날 아침 6시 30분부터 메일이 옵니다. 지금 바로 받아보려면 run-now 파일을 더블클릭하세요.",
    ],
    instructions:
      'name: research-briefing\ndescription: 전일 신규 리서치 리포트를 수집해 팀 브리핑을 발송한다\nschedule: "30 6 * * 1-5"\n\ntools:\n  - portal.search(date, sector)   # 사내 리서치 포털 조회\n  - portal.download(report_id)    # 리포트 PDF 내려받기\n  - rss.fetch(feed_url)           # 외부 리서치 피드\n  - mail.send(to, subject, body)  # 사내 메일 발송\n\n[작업 절차]\n1. 전일 00:00~24:00 신규 리포트를 관심 섹터별로 조회한다.\n2. 같은 종목 리포트가 2건 이상이면 투자의견이 갈리는지 확인해 함께 묶는다.\n3. 투자의견·목표가가 직전 대비 바뀐 건을 브리핑 최상단에 배치한다.\n4. 브리핑을 메일로 발송한다. 실패하면 10분 뒤 2회까지 재시도한다.\n\n[규칙]\n- 리포트에 없는 수치는 만들어내지 않는다.\n- 투자 권유로 읽힐 표현은 쓰지 않는다.\n- 수집 건수가 0이면 "신규 리포트 없음"으로 발송한다.',
    linkUrl: "https://git.hanwhawm.internal/ai-hub/research-briefing",
    outputs: [
      { src: shot("doc", "08/04 리서치 브리핑"), caption: "실제로 발송된 아침 브리핑 메일 (리포트 27건 수집)" },
      { src: shot("table", "수집 로그 · 최근 2주"), caption: "매일 수집 건수와 발송 결과 로그" },
    ],
    reviews: [
      {
        author: "강태양",
        daysAgo: 7,
        useCase: "담당 섹터만 바꿔서 연금 상품 관련 리포트 모니터링에 그대로 사용",
        effect:
          "config에서 섹터 목록만 바꿨더니 바로 돌아갔습니다.\n관련 리포트가 나오면 그날 아침에 알게 되니, 예전처럼 뒤늦게 알고 대응하는 일이 없어졌습니다.",
        timeBefore: "h3_8",
        timeAfter: "h1_3",
      },
      {
        author: "윤서연",
        daysAgo: 5,
        useCase: '신입 교육용으로 "리포트 읽는 법" 자료 만들기',
        effect:
          "매일 쌓이는 브리핑을 교육 자료 소재로 그대로 씁니다. 같은 종목을 두고 증권사별 의견이 갈리는 사례를 찾기가 쉬워졌습니다.",
        timeBefore: null,
        timeAfter: null,
      },
    ],
  },
  {
    key: "a2",
    cat: "작성·요약",
    name: "민원 티켓 분류·1차 답변 에이전트",
    daysAgo: 12,
    desc: "상담 시스템에 새 티켓이 들어오면 유형을 분류하고 규정을 찾아 답변 초안까지 붙여둡니다. 발송은 담당자가 승인해야 합니다.",
    author: "최민준",
    runs: 42,
    official: true,
    runType: "event",
    trigger: "신규 티켓이 생성될 때마다",
    targetTask:
      "고객센터로 들어오는 민원·문의 티켓을 분류하고 답변하는 업무입니다.\n상담사가 티켓을 열어 유형을 직접 고르고, 규정집과 상품 자료를 찾아본 뒤 답변을 처음부터 작성했습니다. 바쁜 날에는 분류가 밀려 긴급 건이 뒤로 묻히기도 했습니다.",
    tasks: [
      "새 티켓의 문의 유형을 12종으로 자동 분류",
      "규정·상품 문서에서 근거를 찾아 답변 초안 작성",
      "고객 감정 수위를 판단해 긴급 건은 팀장 큐로 승격",
      "초안과 근거 조항을 티켓에 첨부해 담당자 승인 대기",
    ],
    tools: ["상담 티켓 시스템 (읽기·쓰기)", "사내 규정 문서 저장소", "상품 정보 DB", "팀장 알림 채널"],
    effect:
      "티켓 하나당 40분씩 걸리던 분류·초안 작성이 8분으로 줄었습니다. 상담사는 초안을 검토하고 고치는 일만 합니다.\n긴급 건 승격이 자동이라, 화가 난 고객이 뒤로 밀리는 일이 없어졌습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["상담 티켓 시스템 계정 (담당 팀 단위로 신청)", "고객지원팀 승인 — 개인이 임의로 연결할 수 없습니다"],
    howToUse: [
      '고객지원팀에 "티켓 에이전트 연결 신청"을 메일로 보냅니다. 양식은 아래 바로가기에 있습니다.',
      "승인이 나면 담당자가 우리 팀 티켓 큐에 에이전트를 붙여줍니다.",
      "이후에는 새 티켓이 들어올 때마다 초안이 자동으로 붙습니다. 따로 실행할 것이 없습니다.",
      "티켓을 열면 상단에 「AI 초안」 탭이 생깁니다. 내용을 확인하고 고친 뒤 발송하세요.",
      "초안이 어긋나면 티켓 하단 [초안 부적절] 버튼을 눌러주세요. 분류 기준 보정에 쓰입니다.",
    ],
    instructions:
      'name: ticket-triage\ndescription: 신규 상담 티켓을 분류하고 근거 기반 답변 초안을 생성한다\ntrigger: on_ticket_created\n\ntools:\n  - ticket.read(ticket_id)\n  - ticket.update(ticket_id, category, draft, priority)\n  - docs.search(query, source=["규정","상품"])\n  - notify.escalate(team_lead, ticket_id)\n\n[작업 절차]\n1. 티켓 본문을 읽고 문의 유형 12종 중 하나로 분류한다.\n2. 규정·상품 문서에서 근거를 검색한다. 근거를 찾지 못하면 초안을 만들지 않고 "근거 없음"으로 표시한다.\n3. 고객 감정 수위를 상/중/하로 판단한다. "상"이면 팀장에게 승격 알림을 보낸다.\n4. 초안과 근거 조항을 티켓에 첨부한다.\n\n[규칙]\n- 절대 고객에게 직접 발송하지 않는다. 담당자 승인 전까지는 초안 상태로만 둔다.\n- 원금 보장·수익 확정 등 오인 소지 표현을 쓰지 않는다.\n- 고객 개인정보를 초안 본문에 옮겨 적지 않는다.',
    linkUrl: "https://portal.hanwhawm.internal/cs/agent-request",
    outputs: [
      { src: shot("chat", "티켓 AI 초안 탭"), caption: "환불 지연 티켓에 자동으로 붙은 답변 초안과 근거 조항" },
      { src: shot("chart", "유형별 티켓 분류 정확도"), caption: "운영 2개월간 유형 분류 정확도 (담당자 수정률 기준)" },
    ],
    reviews: [
      {
        author: "정하은",
        daysAgo: 8,
        useCase: "신규 ISA 상품 오픈 첫 주 문의 폭주 대응",
        effect:
          "오픈 첫 주에 티켓이 평소 4배로 들어왔는데 밀리지 않았습니다. 초안이 이미 붙어 있으니 상담사는 검토만 하면 됐습니다.\n긴급 승격 덕분에 불만 건을 당일에 다 처리했습니다.",
        timeBefore: "over_1d",
        timeAfter: "h3_8",
      },
    ],
  },
  {
    key: "a3",
    cat: "점검·대조",
    name: "월 마감 데이터 정합성 점검 에이전트",
    daysAgo: 6,
    desc: "마감 폴더의 엑셀 12종을 스스로 열어 회계시스템 값과 대조하고, 안 맞는 항목만 골라 점검 결과서를 만들어줍니다.",
    author: "권다은",
    runs: 32,
    runType: "skill",
    trigger: '"마감 점검해줘" 라고 부르면 실행',
    targetTask:
      "매월 마감 때 부서별로 올라온 엑셀들이 서로 맞는지, 회계시스템 값과 일치하는지 확인하는 업무입니다.\n파일 12개를 번갈아 열어 계정별 합계를 눈으로 대조했고, 숫자 하나 틀리면 처음부터 다시 봐야 했습니다. 마감 주에는 이 일로 반나절씩 썼습니다.",
    tasks: [
      "마감 폴더의 엑셀 12종을 모두 열어 계정별 합계 대조",
      "회계시스템 조회값과 다른 건을 골라냄",
      "전월 대비 20% 이상 변동한 항목을 따로 표시",
      "불일치 목록과 근거 셀 위치를 담은 점검 결과서를 엑셀로 생성",
    ],
    tools: ["마감 폴더의 엑셀 파일 (읽기)", "전월 마감 파일 (비교)", "사내 회계시스템 조회 API", "결과서 저장 폴더 (쓰기)"],
    effect:
      "반나절 걸리던 마감 점검이 25분으로 줄었습니다.\n더 중요한 건, 사람이 놓치던 소수점 반올림 차이나 계정 오분류가 걸러진다는 점입니다. 지난 3개월 동안 눈으로는 못 찾았을 불일치를 11건 잡았습니다.",
    timeBefore: "m30_60",
    timeAfter: "under_10m",
    prerequisites: [
      "Claude Code가 설치된 PC (IT기획팀 배포판)",
      "마감 파일이 모여 있는 공유 폴더 접근 권한",
      "회계시스템 조회 계정 (조회 전용이면 충분합니다)",
    ],
    howToUse: [
      "아래 [바로가기]의 사내 Git 저장소에서 closing-check.md 를 내려받습니다.",
      "내 PC의 .claude/agents 폴더에 그 파일을 넣습니다. 폴더가 없으면 새로 만드세요.",
      "Claude Code를 껐다가 다시 켭니다.",
      '마감 파일이 있는 폴더에서 Claude Code를 열고 "마감 점검해줘" 라고 입력합니다.',
      "점검이 끝나면 같은 폴더에 「마감점검결과_YYYYMM.xlsx」 가 생깁니다. 빨간 표시된 행만 확인하면 됩니다.",
    ],
    instructions:
      'name: closing-check\ndescription: 월 마감 엑셀들을 상호 대조하고 회계시스템과 정합성을 점검한다\n\ntools:\n  - excel.read(path, sheet)\n  - excel.write(path, rows)\n  - accounting.query(account_code, period)\n  - fs.list(folder)\n\n[작업 절차]\n1. 지정 폴더의 엑셀을 모두 찾아 계정 코드별 합계를 집계한다.\n2. 파일 간 같은 계정 코드의 합계가 다르면 불일치로 기록한다.\n3. 회계시스템 조회값과 대조한다. 차이가 1원 이상이면 불일치로 기록한다.\n4. 전월 마감 파일과 비교해 20% 이상 변동한 계정을 별도 표시한다.\n5. 불일치 목록을 「파일명 / 시트 / 셀 위치 / 우리값 / 시스템값 / 차이」 형식으로 엑셀에 쓴다.\n\n[규칙]\n- 원본 마감 파일은 절대 수정하지 않는다. 읽기만 한다.\n- 차이 원인을 추측해서 적지 않는다. 사실만 기록한다.\n- 조회에 실패한 계정은 "확인 불가"로 남기고 넘어간다.',
    linkUrl: "https://git.hanwhawm.internal/ai-hub/closing-check",
    outputs: [
      { src: shot("table", "마감점검결과_202607.xlsx"), caption: "7월 마감 점검 결과 — 불일치 4건, 급변동 7건" },
      { src: shot("doc", "점검 실행 로그"), caption: "엑셀 12종 · 회계 조회 340건 처리 로그 (23분 소요)" },
    ],
    reviews: [
      {
        author: "이도현",
        daysAgo: 5,
        useCase: "본부 단위 마감에 그대로 적용 (파일 30개로 확대)",
        effect:
          "파일 개수만 늘렸는데 문제없이 돌았습니다. 본부 마감은 원래 이틀 잡았는데 하루로 줄었습니다.\n셀 위치까지 찍어줘서 담당자에게 \"여기 확인해주세요\" 하고 바로 넘길 수 있는 게 좋습니다.",
        timeBefore: "over_1d",
        timeAfter: "h3_8",
      },
    ],
  },
  {
    key: "a4",
    cat: "작성·요약",
    name: "사내 규정 Q&A · 유권해석 접수 봇",
    daysAgo: 15,
    desc: "Teams에서 물어보면 근거 조항과 함께 답하고, 규정에 없는 건은 유권해석 요청까지 스스로 접수해줍니다.",
    author: "이도현",
    runs: 45,
    official: true,
    runType: "app",
    trigger: "Teams에서 봇을 부를 때",
    targetTask:
      '"이거 해도 되나요?" 하는 규정 문의에 답하는 업무입니다.\n규정집이 PDF 여러 권으로 흩어져 있어 컴플라이언스 담당자가 매번 직접 찾아 읽고 답해줬습니다. 규정에 없는 건은 유권해석 요청서를 따로 작성해 접수해야 했고, 그 과정에서 며칠씩 걸렸습니다.',
    tasks: [
      "질문에 해당하는 조항을 찾아 근거와 함께 답변",
      "규정에서 확인되지 않으면 유권해석 요청을 자동 접수",
      "접수번호와 담당자를 질문자에게 회신",
      "같은 질문이 3회 이상 나오면 FAQ 등록을 담당자에게 제안",
    ],
    tools: ["사내 규정 문서 저장소", "유권해석 대장 (읽기·등록)", "Teams 봇", "컴플라이언스팀 알림"],
    effect:
      "담당자가 문의 하나에 20분씩 쓰던 것(규정집 뒤져 근거 찾고 회신)이 사라졌습니다. 질문자 입장에서도 반나절 기다리던 답을 즉시 받습니다.\n답변에 조항 번호가 붙어 나와서 \"누가 그랬는데요\" 식 전달 오류가 없어졌고, 유권해석 접수도 대화 안에서 끝나니 왕복 메일이 사라졌습니다.",
    timeBefore: "m10_30",
    timeAfter: "under_10m",
    prerequisites: ["사내 Teams 계정", "사내망 접속 (VPN 포함)"],
    howToUse: [
      'Teams 검색창에 "규정봇" 을 입력해 봇을 추가합니다.',
      "우리 팀 채널에 봇을 초대하면 팀원 모두가 쓸 수 있습니다.",
      '평소 말하듯 물어봅니다. 예) "외부 AI에 고객 이름 넣어도 되나요?"',
      "답변 아래 조항 번호를 누르면 규정 원문이 열립니다.",
      '규정에 없는 내용이면 봇이 "유권해석 접수할까요?" 라고 묻습니다. [네] 를 누르면 접수번호가 바로 나옵니다.',
    ],
    instructions:
      'name: policy-qa-bot\ndescription: 사내 규정 질의에 근거 기반으로 답하고 필요 시 유권해석을 접수한다\ntrigger: on_teams_mention\n\ntools:\n  - policy.search(query)\n  - policy.get_article(article_id)\n  - interpretation.file(question, requester)   # 유권해석 접수\n  - teams.reply(thread_id, message)\n\n[작업 절차]\n1. 질문을 규정 저장소에서 검색한다.\n2. 근거 조항을 찾으면 답변 끝에 [근거: 제O조 O항] 을 붙여 회신한다.\n3. 근거를 찾지 못하면 "규정에서 확인되지 않습니다" 라고 답하고 유권해석 접수를 제안한다.\n4. 사용자가 동의하면 유권해석 대장에 등록하고 접수번호와 담당자를 회신한다.\n\n[규칙]\n- 규정 원문에 없는 내용을 추론해서 답하지 않는다.\n- 판단이 갈릴 수 있는 사안은 반드시 담당 부서를 함께 안내한다.\n- 질문에 고객 실명·계좌번호가 포함되면 답변 전에 삭제를 안내한다.',
    linkUrl: "https://teams.hanwhawm.internal/bots/policy-qa",
    outputs: [
      { src: shot("chat", "Teams 규정봇 대화"), caption: '"외부 AI에 고객 정보 입력 가능?" 질의와 근거 조항 회신' },
      { src: shot("chart", "월별 문의 건수 추이"), caption: "봇 도입 후 컴플라이언스팀 직접 문의 68% 감소" },
    ],
    reviews: [
      {
        author: "최민준",
        daysAgo: 11,
        useCase: "신규 입사자 온보딩 규정 교육에 봇을 함께 안내",
        effect:
          "교육 후 들어오던 반복 문의가 거의 없어졌습니다. 신입들이 스스로 찾아보고 답이 애매할 때만 물어봅니다.\n유권해석 접수가 자동이라 대장 누락이 사라진 것도 큽니다.",
        timeBefore: null,
        timeAfter: null,
      },
      {
        author: "박소영",
        daysAgo: 6,
        useCase: "리포트에 외부 데이터 인용 가능 여부 확인",
        effect: "예전에는 컴플라이언스팀에 메일 보내고 하루 기다렸는데, 채널에서 물어보고 30초 만에 조항 확인하고 진행했습니다.",
        timeBefore: "h3_8",
        timeAfter: "under_10m",
      },
    ],
  },
  {
    key: "a5",
    cat: "작성·요약",
    name: "회의 녹취 → 회의록·할 일 자동 등록",
    daysAgo: 20,
    desc: "녹취 파일을 폴더에 넣어두면 회의록을 만들고, 액션아이템을 협업툴 할 일 보드에 카드로 직접 등록합니다.",
    author: "윤서연",
    runs: 28,
    runType: "skill",
    trigger: "녹취 파일을 지정 폴더에 넣으면",
    targetTask:
      "회의가 끝나고 회의록을 정리해 공유하고, 할 일을 협업툴에 옮겨 적는 업무입니다.\n녹취를 다시 들으며 받아 적다 보니 회의 시간만큼 정리 시간이 또 들었고, 회의록은 썼는데 할 일 등록을 깜빡해 다음 회의에서 다시 논의하는 일이 잦았습니다.",
    tasks: [
      "녹취 파일을 받아 화자별로 발언 정리",
      "결정사항과 보류사항을 구분",
      "액션아이템을 담당자·기한과 함께 추출",
      "협업툴 할 일 보드에 카드로 자동 등록",
      "회의록을 팀 공유 드라이브에 저장하고 링크 회신",
    ],
    tools: ["Teams 회의 녹취 파일", "사내 협업툴 할 일 보드 (등록)", "팀 공유 드라이브 (쓰기)", "사내 조직도 (담당자 매칭)"],
    effect:
      '회의록 정리가 회의 직후 6분이면 끝납니다.\n가장 크게 달라진 건 할 일 누락입니다. 회의에서 나온 액션아이템이 자동으로 보드에 올라가니 "그거 누가 하기로 했었죠?" 가 없어졌습니다.',
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["Claude Code가 설치된 PC", "Teams 녹취 다운로드 권한", "협업툴 할 일 보드 등록 권한"],
    howToUse: [
      "아래 [바로가기]의 사내 Git 저장소에서 meeting-notes.md 를 내려받아 .claude/agents 폴더에 넣습니다.",
      "같은 저장소의 board.json 을 열어 우리 팀 보드 주소만 바꿔 저장합니다.",
      "Claude Code를 다시 켭니다.",
      "회의가 끝나면 Teams에서 녹취를 내려받아 「회의녹취」 폴더에 넣습니다.",
      "몇 분 뒤 공유 드라이브에 회의록이 저장되고, 협업툴 보드에 할 일 카드가 올라옵니다. 담당자가 안 정해진 항목은 「미정」으로 등록되니 확인만 해주세요.",
    ],
    instructions:
      'name: meeting-notes\ndescription: 회의 녹취에서 회의록을 작성하고 액션아이템을 협업툴에 등록한다\ntrigger: on_file_added(folder="회의녹취")\n\ntools:\n  - transcript.parse(path)\n  - org.lookup(name)              # 사내 조직도에서 담당자 확인\n  - board.create_card(title, assignee, due)\n  - drive.save(path, content)\n\n[작업 절차]\n1. 녹취를 화자별로 정리하고 주제 단위로 묶는다.\n2. 결정사항 / 보류·추가 논의 / 액션아이템 세 덩어리로 나눈다.\n3. 액션아이템마다 담당자를 조직도에서 확인해 계정을 매칭한다.\n4. 협업툴 보드에 카드를 등록한다. 담당자를 특정할 수 없으면 "미정"으로 둔다.\n5. 회의록을 공유 드라이브에 저장하고 링크를 회신한다.\n\n[규칙]\n- 녹취에 없는 결정사항을 만들어내지 않는다.\n- 기한이 언급되지 않으면 비워두고 "기한 확인 필요"로 표시한다.\n- 인사·평가 관련 발언이 감지되면 회의록에서 제외하고 담당자에게만 알린다.',
    linkUrl: "https://git.hanwhawm.internal/ai-hub/meeting-notes",
    outputs: [
      { src: shot("doc", "회의록 자동 생성 결과"), caption: "80분 회의 녹취 → 결정사항 6건 · 액션아이템 9건" },
      { src: shot("table", "협업툴 보드 자동 등록"), caption: "추출된 액션아이템이 담당자별 카드로 등록된 화면" },
    ],
    reviews: [],
  },
  {
    key: "a6",
    cat: "점검·대조",
    name: "신규 약관 조항 대조 검토 에이전트",
    daysAgo: 26,
    desc: "신규 상품 약관을 표준약관·과거 지적사례와 조항 단위로 대조해 봐야 할 조항만 추려줍니다.",
    author: "한지우",
    runs: 26,
    runType: "skill",
    trigger: "약관 파일을 넣고 실행할 때",
    targetTask:
      "신규 상품을 낼 때 약관이 표준약관에서 얼마나 벗어났는지, 과거에 지적받은 조항과 비슷한 건 없는지 검토하는 업무입니다.\n두 문서를 나란히 띄워 놓고 조항을 하나씩 눈으로 대조했습니다. 약관이 200조항을 넘으면 하루를 꼬박 썼고, 그래도 놓치는 조항이 있었습니다.",
    tasks: [
      "신규 약관을 표준약관과 조항 단위로 대조",
      "추가·삭제·변경된 조항을 표시",
      "과거 지적사례 아카이브에서 유사 조항을 찾아 경고",
      "검토의견서 초안을 조항별 코멘트와 함께 생성",
    ],
    tools: ["표준약관 문서 세트", "과거 약관·지적사례 아카이브", "금감원 공시 자료 (조회)", "검토의견서 템플릿"],
    effect:
      "조항 대조를 에이전트가 먼저 훑어주니 검토자는 표시된 20~30개 조항만 보면 됩니다.\n시간도 줄었지만, 놓치는 조항이 사실상 없어진 게 가장 큽니다. 과거 지적사례와 비슷한 조항을 미리 경고해주는 게 특히 유용합니다.",
    timeBefore: null,
    timeAfter: null,
    prerequisites: [
      "Claude Code가 설치된 PC",
      "표준약관 문서 세트 (컴플라이언스팀에서 배포)",
      "검토할 신규 약관 파일 (docx 또는 pdf)",
    ],
    howToUse: [
      "아래 [바로가기]의 사내 Git 저장소에서 clause-diff 폴더를 내려받습니다.",
      ".claude/agents 폴더에 clause-diff.md 를 넣고, standards 폴더에 표준약관 문서를 넣습니다.",
      "Claude Code를 다시 켭니다.",
      '검토할 약관 파일을 「검토대상」 폴더에 넣고 "약관 대조해줘" 라고 입력합니다.',
      "「검토의견서_초안.docx」 가 생성됩니다. 빨간색은 반드시 확인, 노란색은 참고 조항입니다.",
    ],
    instructions:
      'name: clause-diff\ndescription: 신규 약관을 표준약관·과거 지적사례와 대조해 검토의견서 초안을 만든다\n\ntools:\n  - doc.parse(path)               # docx/pdf 조항 단위 파싱\n  - standards.load(product_type)\n  - archive.search(clause_text)   # 과거 지적사례 유사도 검색\n  - doc.write(path, content)\n\n[작업 절차]\n1. 신규 약관과 표준약관을 조항 단위로 파싱한다.\n2. 조항별로 추가 / 삭제 / 변경 / 동일 을 판정한다.\n3. 변경·추가 조항은 과거 지적사례 아카이브에서 유사 조항을 검색한다.\n4. 유사도가 높은 지적사례가 있으면 해당 조항을 "확인 필요(빨강)" 로 표시한다.\n5. 조항별 코멘트를 붙여 검토의견서 초안을 생성한다.\n\n[규칙]\n- 법적 판단을 내리지 않는다. 대조 결과와 과거 사례만 제시한다.\n- 판정이 애매한 조항은 "동일" 로 넘기지 말고 "확인 필요" 로 둔다.\n- 초안은 반드시 검토자 승인을 거친다는 문구를 문서 첫 줄에 넣는다.',
    linkUrl: null,
    outputs: [
      { src: shot("doc", "검토의견서 초안"), caption: "신규 ELS 약관 218조항 대조 — 확인 필요 23건" },
      { src: shot("table", "조항별 대조 결과"), caption: "추가 14 · 변경 31 · 삭제 6 · 동일 167" },
    ],
    reviews: [
      {
        author: "최민준",
        daysAgo: 14,
        useCase: "상품기획팀에서 넘어온 약관 1차 검토",
        effect:
          "기획팀에서 이미 대조 결과를 붙여서 넘겨주니 저희는 표시된 조항만 봅니다. 반려 후 재검토 왕복이 확 줄었습니다.",
        timeBefore: null,
        timeAfter: null,
      },
    ],
  },
  {
    key: "a7",
    cat: "작성·요약",
    name: "WM 상담일지 핵심 요약 에이전트",
    daysAgo: 3,
    desc: "상담일지에서 고객 요구, 약속한 후속 조치, 적합성 확인 항목을 분리해 CRM 기록 초안을 만듭니다.",
    author: "남우진",
    runs: 36,
    runType: "app",
    trigger: "상담 종료 후 담당자가 녹취록 또는 메모를 업로드할 때",
    targetTask: "WM 상담 후 메모를 다시 읽어 고객 관심 상품과 후속 일정을 CRM 형식에 맞춰 정리하는 업무입니다. 누락된 적합성 확인 항목을 찾는 데도 시간이 들었습니다.",
    tasks: ["상담 내용에서 고객 요구와 제약 조건 분리", "후속 연락 일정과 담당자 할 일 추출", "투자성향·적합성 확인 누락 항목 표시", "CRM 상담일지 형식으로 초안 작성"],
    tools: ["상담 녹취 텍스트", "WM CRM 상담일지", "상품 적합성 점검 기준"],
    effect: "상담 한 건의 기록 시간이 평균 35분에서 12분으로 줄고, 다음 상담 전에 확인할 후속 조치가 일정한 형식으로 남습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["고객 식별정보를 제거한 상담 메모", "WM CRM 작성 권한", "팀 승인 상담일지 템플릿"],
    howToUse: ["상담 메모에서 고객명과 계좌번호를 삭제합니다.", "상담일지 작성 화면에서 AI 요약을 선택하고 메모를 붙여넣습니다.", "누락 경고와 후속 일정이 맞는지 확인한 뒤 CRM에 저장합니다."],
    instructions: `상담 메모를 고객 요구, 제약 조건, 관심 상품, 후속 조치로 나눈다.
적합성 확인 문구가 없으면 추정하지 말고 확인 필요로 표시한다.
금융상품 가입 의사를 확정적으로 표현하지 않는다.
출력은 WM CRM 상담일지의 항목 순서를 따른다.`,
    linkUrl: null,
    outputs: [{ src: shot("doc", "WM 상담일지 초안"), caption: "요구사항·후속 조치·확인 필요 항목이 분리된 상담일지" }],
    reviews: [{ author: "신유나", daysAgo: 2, useCase: "퇴직연금 이전 상담 후속 조치 정리", effect: "약속한 연락 날짜와 추가 서류가 한 번에 정리되어 재확인 전화가 줄었습니다.", timeBefore: "m30_60", timeAfter: "m10_30" }],
  },
  {
    key: "a8",
    cat: "조사·수집",
    name: "해외주식 실적발표 모니터 에이전트",
    daysAgo: 5,
    desc: "관심 종목의 실적발표 자료와 컨퍼런스콜 핵심 변화를 모아 장 시작 전 점검표를 만듭니다.",
    author: "도지안",
    runs: 42,
    runType: "schedule",
    trigger: "미국 장 마감 후 평일 오전 7시",
    targetTask: "밤사이 발표된 실적 자료, 가이던스, 컨퍼런스콜 발언을 여러 사이트에서 확인해 데일리 브리핑으로 묶는 업무입니다.",
    tasks: ["관심 종목 실적발표 여부 확인", "매출·이익·가이던스의 컨센서스 차이 정리", "전분기 대비 경영진 발언 변화 추출", "원문 링크가 포함된 장전 브리핑 작성"],
    tools: ["거래소 공시 피드", "기업 IR 사이트", "실적 컨센서스 DB", "팀 메일"],
    effect: "담당자가 새벽 자료를 일일이 찾는 시간을 줄이고, 숫자와 경영진 발언의 출처를 함께 확인할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["관심 종목 티커 목록", "실적 컨센서스 DB 조회 권한", "팀 배포 메일 주소"],
    howToUse: ["관심 종목 목록과 실적발표 기간을 설정합니다.", "매일 생성된 브리핑에서 출처 링크와 통화 단위를 확인합니다.", "고객 배포 전 리서치 담당자의 검토를 거칩니다."],
    instructions: `공식 IR 자료와 거래소 공시를 우선 출처로 사용한다.
컨센서스 대비 차이는 통화와 회계 기준을 맞춘 뒤 계산한다.
경영진 발언은 원문 위치를 함께 남긴다.
투자의견이나 목표주가를 새로 만들지 않는다.`,
    linkUrl: null,
    outputs: [{ src: shot("table", "해외주식 실적 모니터"), caption: "실적·가이던스·경영진 발언 변화가 정리된 장전 점검표" }],
    reviews: [{ author: "마서현", daysAgo: 3, useCase: "반도체 관심 종목 실적 시즌 모니터링", effect: "가이던스 변경 종목을 먼저 볼 수 있어 아침 회의 준비가 빨라졌습니다.", timeBefore: "h1_3", timeAfter: "m10_30" }],
  },
  {
    key: "a9",
    cat: "분석·진단",
    name: "연금 포트폴리오 이탈 점검 에이전트",
    daysAgo: 8,
    desc: "모델 포트폴리오와 고객 운용 지시의 차이를 계산해 허용 범위를 벗어난 계좌군을 우선 점검합니다.",
    author: "공서진",
    runs: 34,
    runType: "app",
    trigger: "월간 리밸런싱 점검 파일을 업로드할 때",
    targetTask: "연금 포트폴리오의 자산군 비중을 모델과 대조하고, 허용 편차를 넘은 계좌군을 찾아 담당자에게 배정하는 업무입니다.",
    tasks: ["자산군별 현재 비중과 모델 비중 계산", "허용 편차 초과 계좌군 식별", "원인 후보를 입출금·시장 변동으로 구분", "담당자별 점검 목록 생성"],
    tools: ["비식별 계좌군 잔고 파일", "모델 포트폴리오 기준표", "리밸런싱 예외 규칙"],
    effect: "전체 목록을 수작업으로 대조하는 대신 편차가 큰 계좌군부터 검토해 월간 점검 시간을 절반 이하로 줄였습니다.",
    timeBefore: "h1_3",
    timeAfter: "m30_60",
    prerequisites: ["고객 식별값을 제거한 잔고 집계", "당월 모델 포트폴리오", "승인된 허용 편차 기준"],
    howToUse: ["잔고 파일과 모델 기준표의 기준일을 맞춥니다.", "분석 화면에 두 파일을 업로드합니다.", "예외 사유를 확인하고 담당자별 점검표를 내려받습니다."],
    instructions: `계좌 단위 식별정보는 입력받지 않는다.
자산군 코드를 기준표와 매핑한 뒤 비중 차이를 계산한다.
허용 편차 초과 여부와 계산 근거를 함께 표시한다.
매매나 리밸런싱을 자동 실행하지 않는다.`,
    linkUrl: null,
    outputs: [{ src: shot("chart", "연금 포트폴리오 편차"), caption: "자산군별 편차와 우선 점검 계좌군 분포" }],
    reviews: [{ author: "나예원", daysAgo: 4, useCase: "월말 DC형 모델 포트폴리오 점검", effect: "입출금 때문인 편차와 시장 변동 편차가 구분돼 검토 순서를 잡기 쉬웠습니다.", timeBefore: "h3_8", timeAfter: "h1_3" }],
  },
  {
    key: "a10",
    cat: "번역·교정",
    name: "영문 공시 번역·용어 검수 에이전트",
    daysAgo: 11,
    desc: "영문 공시를 사내 용어집에 맞춰 번역하고 수치·날짜·고유명사의 원문 대조표를 함께 만듭니다.",
    author: "송재윤",
    runs: 28,
    runType: "app",
    trigger: "영문 공시 PDF 또는 HTML을 등록할 때",
    targetTask: "해외 기업 공시의 핵심 내용을 번역한 뒤 금융 용어와 숫자가 원문과 일치하는지 재검토하는 업무입니다.",
    tasks: ["문단 구조를 유지한 한국어 번역", "사내 금융 용어집 적용", "숫자·통화·날짜 원문 대조", "해석이 갈릴 문장에 검토 표시"],
    tools: ["영문 공시 원문", "사내 금융 용어집", "통화·단위 표기 기준"],
    effect: "초벌 번역과 숫자 대조가 한 번에 제공되어 담당자는 해석이 필요한 문장에 집중할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["공식 공시 원문", "최신 사내 용어집", "배포 전 담당자 검수 절차"],
    howToUse: ["공식 사이트에서 내려받은 원문을 업로드합니다.", "대조표의 숫자와 원문 위치를 확인합니다.", "검토 표시 문장을 수정한 뒤 승인본을 저장합니다."],
    instructions: `표와 각주의 구조를 유지해 번역한다.
금액 단위와 기준 통화를 임의로 환산하지 않는다.
고유명사와 회계 용어는 사내 용어집을 우선 적용한다.
모호한 문장은 단정하지 않고 원문과 함께 검토 표시한다.`,
    linkUrl: null,
    outputs: [{ src: shot("doc", "영문 공시 번역 대조표"), caption: "번역문과 숫자·용어 검수 결과가 함께 표시된 문서" }],
    reviews: [{ author: "표은호", daysAgo: 6, useCase: "미국 상장사 8-K 공시 검토", effect: "수치 대조표 덕분에 단위 오류를 배포 전에 바로 찾았습니다.", timeBefore: "h1_3", timeAfter: "m30_60" }],
  },
  {
    key: "a11",
    cat: "작성·요약",
    name: "디지털 상품 요구사항 정리 에이전트",
    daysAgo: 14,
    desc: "인터뷰 메모와 VOC를 기능 요구사항, 정책 결정, 미해결 쟁점으로 구분해 기획 백로그를 만듭니다.",
    author: "김로아",
    runs: 32,
    runType: "skill",
    trigger: "기획자가 인터뷰 메모와 VOC 파일을 선택해 실행할 때",
    targetTask: "여러 채널에서 모인 요구를 읽고 중복을 합친 뒤 개발 가능한 수준의 요구사항과 확인 질문으로 정리하는 업무입니다.",
    tasks: ["중복 VOC 통합과 원문 출처 연결", "사용자 문제와 기능 요구사항 분리", "정책 결정이 필요한 쟁점 표시", "우선순위 검토용 백로그 생성"],
    tools: ["고객 VOC 비식별 문서", "사용자 인터뷰 메모", "상품 기획 백로그 템플릿"],
    effect: "회의 전에 요구사항 초안과 쟁점이 정리되어 기능 범위 논의가 구체적으로 진행됩니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["개인정보를 제거한 VOC", "프로젝트 목표와 제외 범위", "기획 백로그 작성 권한"],
    howToUse: ["VOC와 인터뷰 메모를 프로젝트 폴더에 모읍니다.", "목표와 제외 범위를 입력하고 정리를 실행합니다.", "원문 근거를 확인해 백로그에 반영합니다."],
    instructions: `VOC의 표현을 기능 요구로 과장하지 않는다.
각 요구사항에 원문 출처와 관련 사용자 문제를 연결한다.
정책 판단이 필요한 항목은 결정하지 말고 질문으로 남긴다.
중복 항목은 합치되 서로 다른 제약 조건은 보존한다.`,
    linkUrl: null,
    outputs: [{ src: shot("table", "디지털 상품 요구사항"), caption: "문제·요구사항·정책 쟁점·근거가 연결된 기획 백로그" }],
    reviews: [{ author: "민재하", daysAgo: 5, useCase: "해외주식 알림 기능 VOC 정리", effect: "비슷해 보이던 요구의 조건 차이가 남아 있어 범위 협의가 쉬웠습니다.", timeBefore: "h3_8", timeAfter: "h1_3" }],
  },
  {
    key: "a12",
    cat: "분석·진단",
    name: "배치 장애 로그 1차 진단 에이전트",
    daysAgo: 18,
    desc: "야간 배치 로그를 실패 구간별로 묶고 최근 정상 실행과 비교해 운영자가 확인할 원인 후보를 제시합니다.",
    author: "서가람",
    runs: 45,
    runType: "event",
    trigger: "배치 모니터링 시스템이 실패 이벤트를 전송할 때",
    targetTask: "대량의 배치 로그에서 최초 오류와 연쇄 오류를 구분하고, 최근 배포나 입력 데이터 변화와 연결해 1차 장애 보고를 만드는 업무입니다.",
    tasks: ["최초 오류와 후속 오류 분리", "최근 정상 로그와 차이 비교", "배포·스키마·입력 지연 원인 후보 분류", "운영 담당자용 점검 순서 작성"],
    tools: ["배치 모니터링 로그", "배포 이력", "데이터 적재 현황", "운영 알림 채널"],
    effect: "당직자가 수천 줄의 로그를 처음부터 읽지 않고 최초 오류와 관련 변경사항부터 확인할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "under_10m",
    prerequisites: ["읽기 전용 로그 접근 권한", "배포 이력 조회 권한", "시스템별 운영 담당자 목록"],
    howToUse: ["모니터링 규칙에 진단 웹훅을 연결합니다.", "알림의 최초 오류와 근거 로그를 확인합니다.", "제안된 점검 순서에 따라 조치하고 결과를 기록합니다."],
    instructions: `오류 메시지를 시간순으로 정렬하고 최초 실패 지점을 찾는다.
최근 정상 실행과 달라진 설정·배포·입력 상태만 원인 후보로 제시한다.
재실행이나 데이터 수정은 자동으로 수행하지 않는다.
비밀값과 고객 데이터는 진단 결과에서 마스킹한다.`,
    linkUrl: "https://git.hanwhawm.internal/ai-hub/batch-triage",
    outputs: [{ src: shot("table", "배치 장애 1차 진단"), caption: "최초 오류·영향 작업·원인 후보·점검 순서가 정리된 보고" }],
    reviews: [{ author: "오세빈", daysAgo: 9, useCase: "야간 기준정보 적재 실패 분석", effect: "연쇄 오류를 제외하고 최초 스키마 오류부터 확인해 복구 시간이 줄었습니다.", timeBefore: "h1_3", timeAfter: "m10_30" }],
  },
  {
    key: "a13",
    cat: "작성·요약",
    name: "IB 딜 심사자료 초안 에이전트",
    daysAgo: 22,
    desc: "딜 개요와 실사 메모를 심사 양식에 맞춰 정리하고 근거가 부족한 항목을 별도 확인 목록으로 남깁니다.",
    author: "강유찬",
    runs: 30,
    runType: "skill",
    trigger: "담당자가 딜 자료 폴더에서 심사 초안 생성을 실행할 때",
    targetTask: "사업 개요, 거래 구조, 주요 리스크, 실사 결과를 여러 문서에서 찾아 심사위원회 양식으로 옮기는 업무입니다.",
    tasks: ["거래 구조와 자금 용도 요약", "재무·법률 실사 쟁점 분류", "리스크와 완화 방안 근거 연결", "미제출 자료와 추가 확인 질문 작성"],
    tools: ["비식별 딜 개요서", "재무·법률 실사 메모", "IB 심사위원회 표준 양식"],
    effect: "문서 간 반복 입력을 줄이고, 근거가 없는 낙관적 표현이 확인 목록으로 분리되어 검토 품질이 높아집니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["보안등급이 확인된 딜 자료", "최신 심사위원회 양식", "담당 심사역 검토 절차"],
    howToUse: ["딜 코드별 보안 폴더에 승인된 자료만 넣습니다.", "거래 유형과 심사 일정을 선택해 초안을 생성합니다.", "근거 링크와 확인 질문을 검토한 뒤 위원회 양식으로 확정합니다."],
    instructions: `입력 문서에 없는 거래 조건과 재무 수치를 만들지 않는다.
모든 핵심 수치에 문서명과 페이지를 근거로 남긴다.
미확정 조건은 확정 문장으로 바꾸지 않는다.
심사 결론을 대신 내리지 않고 사실과 쟁점을 구조화한다.`,
    linkUrl: null,
    outputs: [{ src: shot("doc", "IB 딜 심사자료 초안"), caption: "거래 구조·실사 쟁점·추가 확인사항이 정리된 심사 문서" }],
    reviews: [{ author: "노채원", daysAgo: 10, useCase: "인수금융 예비심사 자료 정리", effect: "실사 메모의 근거 페이지가 연결돼 심사역 재확인이 빨라졌습니다.", timeBefore: "over_1d", timeAfter: "h3_8" }],
  },
  {
    key: "a14",
    cat: "조사·수집",
    name: "금융상품 경쟁사 수수료 모니터 에이전트",
    daysAgo: 25,
    desc: "공식 홈페이지와 약관 공지에서 주요 금융상품의 수수료 변화를 찾아 비교표와 변경 근거를 만듭니다.",
    author: "구지민",
    runs: 38,
    runType: "schedule",
    trigger: "매주 월요일 오전 8시",
    targetTask: "경쟁사 홈페이지와 공지에서 상품별 수수료를 찾아 지난주 값과 비교하고 변경 사유를 확인하는 업무입니다.",
    tasks: ["지정 상품군의 공식 수수료 수집", "직전 주 값과 변경 여부 비교", "프로모션과 상시 수수료 구분", "원문 링크가 포함된 비교표 배포"],
    tools: ["경쟁사 공식 홈페이지", "상품 약관·공지", "내부 수수료 비교 기준표", "팀 메일"],
    effect: "비교표 갱신 시간이 줄고, 한시 프로모션을 상시 수수료로 잘못 기록하는 오류를 예방합니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["모니터링 대상 상품 목록", "공식 공개 페이지 URL", "수수료 항목 표준 매핑표"],
    howToUse: ["대상 회사와 상품 URL을 등록합니다.", "주간 비교표에서 변경 표시와 원문을 확인합니다.", "상품전략 담당자가 승인한 변경만 기준표에 반영합니다."],
    instructions: `공식 홈페이지와 약관 공지만 수치 근거로 사용한다.
프로모션 기간과 적용 조건을 수수료 값과 함께 기록한다.
동일하지 않은 상품은 억지로 직접 비교하지 않는다.
접근 실패 항목은 이전 값으로 덮지 말고 확인 필요로 표시한다.`,
    linkUrl: null,
    outputs: [{ src: shot("table", "경쟁사 수수료 주간 비교"), caption: "상품별 수수료 변화와 공식 근거 링크가 포함된 비교표" }],
    reviews: [{ author: "문서하", daysAgo: 12, useCase: "해외주식 거래 수수료 프로모션 비교", effect: "기간 조건이 같이 표시돼 단순 숫자 비교에서 생기던 오해가 줄었습니다.", timeBefore: "h3_8", timeAfter: "m30_60" }],
  },
  {
    key: "a15",
    cat: "분석·진단",
    name: "경영관리 예산 이상치 탐지 에이전트",
    daysAgo: 27,
    desc: "월별 집행 내역을 예산, 전년 동월, 최근 추세와 비교해 담당자가 확인할 이상 변동을 추립니다.",
    author: "권아린",
    runs: 35,
    runType: "app",
    trigger: "월 마감 집행 파일과 예산 파일을 업로드할 때",
    targetTask: "조직별 비용 집행을 예산과 대조하고 큰 증감의 원인을 계정과목별로 확인해 월간 보고 자료를 만드는 업무입니다.",
    tasks: ["조직·계정과목별 예산 대비 집행률 계산", "전년 동월과 최근 3개월 추세 비교", "일회성 비용과 반복 이상치 구분", "확인 근거가 포함된 점검 목록 생성"],
    tools: ["월 마감 집행 파일", "연간 예산 기준표", "계정과목 매핑표", "조직 코드 기준정보"],
    effect: "전체 계정과목을 동일하게 확인하지 않고 변동 폭과 금액 영향이 큰 항목부터 검토할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["마감 확정 전 집행 파일", "승인된 연간 예산", "조직·계정과목 매핑표"],
    howToUse: ["집행 파일과 예산 파일의 기준월을 확인합니다.", "분석을 실행해 영향 금액 순 점검 목록을 받습니다.", "담당 부서의 소명 내용을 추가해 월간 보고에 반영합니다."],
    instructions: `예산과 집행 파일의 조직·계정과목 코드를 먼저 검증한다.
증감률뿐 아니라 영향 금액을 함께 계산한다.
원인을 임의로 단정하지 않고 데이터에서 확인되는 후보만 제시한다.
내부 보고 기준 이하 금액도 데이터에서 삭제하지 않는다.`,
    linkUrl: null,
    outputs: [{ src: shot("chart", "월간 예산 이상치"), caption: "영향 금액과 증감률 기준의 우선 점검 항목" }],
    reviews: [{ author: "김태오", daysAgo: 13, useCase: "분기 말 판관비 집행 점검", effect: "전년 동월보다 급증한 외주비를 먼저 확인해 소명 요청 시간을 줄였습니다.", timeBefore: "h3_8", timeAfter: "h1_3" }],
  },
  {
    key: "a16",
    cat: "번역·교정",
    name: "해외 운용사 월간보고서 검토 에이전트",
    daysAgo: 29,
    desc: "해외 운용사 보고서를 번역하고 전월 보고서와 비교해 운용전략·위험지표 변화와 확인 질문을 정리합니다.",
    author: "장도하",
    runs: 26,
    runType: "skill",
    trigger: "월간 운용보고서 PDF 두 개를 선택해 비교할 때",
    targetTask: "해외 운용사의 영문 월간보고서를 읽고 성과 요인과 전략 변화를 번역한 뒤 전월과 달라진 위험지표를 찾는 업무입니다.",
    tasks: ["성과 요인과 운용전략 문단 번역", "전월 대비 포지션·위험지표 변화 추출", "수치와 차트 원문 위치 연결", "운용사에 보낼 확인 질문 작성"],
    tools: ["당월·전월 운용보고서", "펀드 용어집", "위험지표 검토 체크리스트"],
    effect: "번역과 전월 비교를 동시에 수행해 정기 운용사 미팅 전에 확인할 질문을 빠르게 준비할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["공식 운용보고서 원본", "해당 펀드 기준 통화", "내부 펀드 용어집"],
    howToUse: ["당월과 전월 PDF를 월 순서에 맞춰 올립니다.", "변화표의 수치와 원문 페이지를 확인합니다.", "담당자가 질문 우선순위를 정해 운용사 미팅 자료에 반영합니다."],
    instructions: `당월과 전월의 기준일과 통화를 먼저 확인한다.
수치 변화는 원문 표의 행과 열을 근거로 남긴다.
운용전략의 의미를 확대 해석하지 않는다.
확인되지 않은 성과 원인은 질문 형태로 작성한다.`,
    linkUrl: null,
    outputs: [{ src: shot("doc", "해외 운용사 월간 비교"), caption: "운용전략·위험지표 변화와 확인 질문이 정리된 검토서" }],
    reviews: [{ author: "오현서", daysAgo: 15, useCase: "글로벌 채권형 펀드 월간 운용보고 검토", effect: "듀레이션 변화의 원문 근거가 바로 연결되어 운용사 질문 준비가 쉬웠습니다.", timeBefore: "h3_8", timeAfter: "h1_3" }],
  },
  {
    key: "a17",
    cat: "분석·진단",
    name: "WM 캠페인 아이디어 검증 에이전트",
    daysAgo: 16,
    desc: "캠페인 아이디어를 대상 고객, 기대 행동, 준법 제약, 측정 지표로 구조화해 실행 가능성을 비교합니다.",
    author: "백예린",
    runs: 33,
    runType: "app",
    trigger: "캠페인 기획 회의 전 아이디어 목록을 입력할 때",
    targetTask: "여러 캠페인 아이디어를 동일한 기준으로 비교하고, 고객 접점과 준법 검토가 필요한 부분을 미리 정리하는 업무입니다.",
    tasks: ["아이디어별 대상 고객과 기대 행동 정의", "채널·운영 조건과 준법 제약 정리", "측정 가능한 성공 지표 제안", "검증 비용과 준비 기간 기준 비교"],
    tools: ["비식별 고객 세그먼트 정의", "과거 캠페인 결과", "마케팅 준법 체크리스트"],
    effect: "선호도만으로 아이디어를 고르지 않고 실행 조건과 측정 방법을 같은 표에서 비교할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["캠페인 목표", "사용 가능한 채널 목록", "준법 사전검토 기준"],
    howToUse: ["아이디어와 목표 행동을 한 줄씩 입력합니다.", "비교표에서 근거가 부족한 가정을 확인합니다.", "선정 후보만 준법 부서와 상세 기획으로 넘깁니다."],
    instructions: `고객 세그먼트는 비식별 집단 수준으로만 다룬다.
성과 수치를 근거 없이 예측하지 않는다.
준법 확인이 필요한 표현과 혜택 조건을 별도 표시한다.
아이디어를 결정하지 않고 비교 가능한 질문과 지표를 제시한다.`,
    linkUrl: null,
    outputs: [{ src: shot("table", "WM 캠페인 검증표"), caption: "대상·행동·제약·측정 지표가 비교된 캠페인 후보표" }],
    reviews: [{ author: "황지호", daysAgo: 8, useCase: "연금 이전 고객 안내 캠페인 사전 검토", effect: "혜택 문구의 준법 확인 지점이 먼저 드러나 기획 재작업이 줄었습니다.", timeBefore: "h1_3", timeAfter: "m30_60" }],
  },
  {
    key: "a18",
    cat: "작성·요약",
    name: "준법 점검 체크리스트 생성 에이전트",
    daysAgo: 7,
    desc: "상품 설명서와 판매 절차 문서에서 적용 규정을 연결해 출시 전 준법 점검 체크리스트를 생성합니다.",
    author: "고은채",
    runs: 40,
    runType: "skill",
    trigger: "검토 대상 상품 문서 폴더에서 체크리스트 생성을 실행할 때",
    targetTask: "상품 출시 전 설명서, 광고 문안, 판매 절차를 규정별로 대조해 필수 확인 항목과 근거 조항을 작성하는 업무입니다.",
    tasks: ["문서별 상품 특성과 판매 채널 추출", "적용 규정·내규 조항 연결", "필수 고지·승인·보관 항목 생성", "증빙 위치가 포함된 점검표 작성"],
    tools: ["상품 설명서", "판매 절차 문서", "준법 규정 저장소", "표준 점검표"],
    effect: "상품마다 점검표를 처음부터 만들지 않고 적용 근거가 연결된 초안을 받아 검토 누락을 줄입니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["검토 대상 최신 문서", "준법 규정 저장소 조회 권한", "상품 유형별 표준 점검표"],
    howToUse: ["검토 대상 문서를 승인된 보안 폴더에 넣습니다.", "상품 유형과 판매 채널을 선택해 체크리스트를 생성합니다.", "준법 담당자가 근거 조항과 증빙 위치를 확인해 확정합니다."],
    instructions: `상품 특성과 판매 채널에 적용되는 규정을 검색한다.
각 점검 항목에 규정명·조항·대상 문서 위치를 연결한다.
법적 적합 여부를 자동 확정하지 않는다.
근거가 충돌하면 두 조항을 모두 제시하고 검토 필요로 표시한다.`,
    linkUrl: null,
    outputs: [{ src: shot("table", "상품 출시 준법 점검표"), caption: "점검 항목과 규정 근거·증빙 위치가 연결된 체크리스트" }],
    reviews: [{ author: "류선우", daysAgo: 5, useCase: "신규 랩어카운트 판매 절차 점검", effect: "채널별 고지 의무가 분리되어 설명서와 모바일 화면을 함께 검토할 수 있었습니다.", timeBefore: "h3_8", timeAfter: "h1_3" }],
  },
  {
    key: "a19",
    cat: "번역·교정",
    name: "위원회 보고서 문체 정리 에이전트",
    daysAgo: 4,
    desc: "부서별 원고를 위원회 보고 형식으로 통일하고 결론, 요청사항, 근거 수치를 한눈에 보이게 정리합니다.",
    author: "박다온",
    runs: 24,
    runType: "skill",
    trigger: "위원회 보고서 초안 파일을 선택해 문체 점검을 실행할 때",
    targetTask: "여러 부서가 작성한 원고의 표현과 단위를 통일하고 의사결정 요청사항을 앞부분에 배치하는 업무입니다.",
    tasks: ["보고서 문장 길이와 종결 표현 통일", "의사결정·보고·참고 안건 구분", "수치 단위와 기준일 표기 점검", "근거 없는 강조 표현 표시"],
    tools: ["위원회 보고서 초안", "사내 보고서 문체 가이드", "수치 표기 기준"],
    effect: "내용을 바꾸지 않으면서 보고서 형식이 통일되어 취합 담당자의 편집 시간이 줄었습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["부서 검토가 끝난 원고", "해당 위원회 표준 양식", "수치 기준일 정보"],
    howToUse: ["초안을 표준 양식에 합친 뒤 점검을 실행합니다.", "수치 기준일과 결정 요청 문구를 확인합니다.", "변경 비교본을 부서 담당자에게 회람해 확정합니다."],
    instructions: `원문의 사실과 결론을 새로 추가하거나 삭제하지 않는다.
의사결정 요청사항은 원문 근거가 있을 때만 앞에 배치한다.
금액·비율·기간의 단위와 기준일을 통일한다.
과장 표현은 중립 문장 제안과 함께 검토 표시한다.`,
    linkUrl: null,
    outputs: [{ src: shot("doc", "위원회 보고서 정리본"), caption: "안건 구분·수치 단위·문체가 통일된 보고서 비교본" }],
    reviews: [{ author: "이수민", daysAgo: 2, useCase: "경영위원회 월간 실적 보고서 취합", effect: "부서마다 달랐던 억원·백만원 단위가 정리되어 재편집이 줄었습니다.", timeBefore: "h1_3", timeAfter: "m30_60" }],
  },
  {
    key: "a20",
    cat: "조사·수집",
    name: "채권 발행시장 데일리 스캔 에이전트",
    daysAgo: 28,
    desc: "당일 채권 발행 공고와 수요예측 결과를 수집해 업종·등급·만기별 시장 동향을 요약합니다.",
    author: "배준서",
    runs: 31,
    runType: "schedule",
    trigger: "평일 오후 5시 30분",
    targetTask: "여러 공시와 시장 자료에서 채권 발행 조건과 수요예측 결과를 찾아 데일리 시장 자료로 정리하는 업무입니다.",
    tasks: ["당일 발행·수요예측 공고 수집", "업종·신용등급·만기별 조건 표준화", "밴드 대비 결정 금리와 주문 배수 계산", "원문 링크가 포함된 데일리 작성"],
    tools: ["거래소·예탁결제원 공개 자료", "신용평가사 공시", "발행시장 내부 기준표", "팀 메일"],
    effect: "발행 조건을 수작업으로 옮기는 시간을 줄이고, 주문 배수와 금리 결정 결과를 같은 기준으로 비교할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["공식 발행 공고 URL", "신용등급·업종 매핑표", "데일리 배포 대상 목록"],
    howToUse: ["발행시장 대상 업종과 등급을 설정합니다.", "오후 생성된 표에서 누락 공고와 단위를 확인합니다.", "담당자 검수 후 팀 데일리로 배포합니다."],
    instructions: `공식 공고와 수요예측 결과만 사용한다.
금리 단위와 만기 표기를 내부 기준으로 통일한다.
주문 배수는 유효 주문과 발행액의 기준을 명시한다.
시장 전망을 임의로 덧붙이지 않는다.`,
    linkUrl: null,
    outputs: [{ src: shot("table", "채권 발행시장 데일리"), caption: "등급·만기·금리·주문 배수가 표준화된 일일 자료" }],
    reviews: [{ author: "신도연", daysAgo: 14, useCase: "AA급 회사채 수요예측 결과 정리", effect: "결정 금리와 주문 배수 계산 기준이 통일돼 딜 비교가 쉬웠습니다.", timeBefore: "h1_3", timeAfter: "m30_60" }],
  },
  {
    key: "a21",
    cat: "분석·진단",
    name: "디지털 채널 전환 퍼널 분석 에이전트",
    daysAgo: 45,
    desc: "비식별 이벤트 집계로 상품 탐색부터 신청 완료까지의 이탈 구간과 채널별 차이를 분석합니다.",
    author: "문예준",
    runs: 29,
    runType: "app",
    trigger: "주간 퍼널 집계 파일을 업로드할 때",
    targetTask: "웹과 앱의 단계별 방문·이탈 수치를 비교하고 전주 대비 변화가 큰 구간의 원인 후보를 찾는 업무입니다.",
    tasks: ["채널별 퍼널 단계 전환율 계산", "전주·4주 평균 대비 변화 탐지", "기기·유입경로별 차이 분해", "점검할 화면과 이벤트 목록 제시"],
    tools: ["비식별 채널 이벤트 집계", "퍼널 단계 정의서", "배포·장애 이력"],
    effect: "대시보드 수치를 옮기는 작업 대신 이탈 변화가 큰 구간과 관련 배포 이력을 함께 검토할 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["개인 식별값이 없는 집계 파일", "승인된 퍼널 단계 정의", "최근 배포 이력"],
    howToUse: ["주간 집계 파일의 기간과 채널을 확인합니다.", "퍼널 정의 버전을 선택해 분석합니다.", "변화 구간과 배포 이력을 확인해 실험 또는 수정 과제로 등록합니다."],
    instructions: `개인 단위 이벤트를 입력받거나 재식별하지 않는다.
전환율의 분모와 기간을 모든 표에 명시한다.
상관관계를 원인으로 단정하지 않는다.
표본이 적은 세그먼트도 숨기지 않고 주의 표시한다.`,
    linkUrl: null,
    outputs: [{ src: shot("chart", "디지털 전환 퍼널"), caption: "채널별 전환율과 전주 대비 이탈 변화가 표시된 분석" }],
    reviews: [{ author: "배하람", daysAgo: 20, useCase: "해외주식 계좌개설 퍼널 주간 점검", effect: "본인인증 단계 이탈과 해당 주 배포 이력을 같이 확인해 원인 조사 범위가 줄었습니다.", timeBefore: "h3_8", timeAfter: "h1_3" }],
  },
  {
    key: "a22",
    cat: "분석·진단",
    name: "사내 교육 수요 설문 테마 도출 에이전트",
    daysAgo: 75,
    desc: "익명 설문 응답을 직무 과제와 학습 장애요인으로 묶어 교육 과정 후보와 검증 질문을 제안합니다.",
    author: "노유진",
    runs: 22,
    runType: "app",
    trigger: "익명화된 교육 수요 설문 파일을 업로드할 때",
    targetTask: "자유서술 설문을 읽고 반복되는 업무 어려움과 원하는 교육 형태를 분류해 연간 교육 기획 자료를 만드는 업무입니다.",
    tasks: ["자유서술 응답의 직무 과제 분류", "반복 테마와 상반된 요구 구분", "대상 직군·난이도·교육 방식 후보 정리", "추가 인터뷰가 필요한 가설 제시"],
    tools: ["익명 교육 수요 설문", "직무 체계 기준표", "기존 교육 과정 목록"],
    effect: "키워드 빈도만 보지 않고 실제 업무 과제와 학습 방식 요구를 연결해 과정 기획의 근거를 남길 수 있습니다.",
    timeBefore: "m30_60",
    timeAfter: "m10_30",
    prerequisites: ["이름·사번을 제거한 설문 파일", "최신 직무 체계", "기존 과정과 만족도 자료"],
    howToUse: ["설문 파일에서 이름과 연락처 열을 제거합니다.", "분석 범위와 대상 직군을 선택합니다.", "테마별 원문 예시를 확인하고 인터뷰 대상 과제를 선정합니다."],
    instructions: `응답자를 특정할 수 있는 정보는 분석하지 않는다.
빈도와 함께 서로 다른 직무 맥락을 보존한다.
소수 의견을 삭제하지 않고 별도 테마로 표시한다.
교육 과정 확정 대신 검증할 과제와 질문을 제안한다.`,
    linkUrl: null,
    outputs: [{ src: shot("chart", "교육 수요 테마"), caption: "직무 과제·난이도·선호 방식별 설문 테마 분석" }],
    reviews: [{ author: "진서율", daysAgo: 32, useCase: "생성형 AI 실무 교육 수요 분석", effect: "초급 도구 교육보다 직무별 문서 검토 사례 수요가 크다는 점을 확인했습니다.", timeBefore: "h3_8", timeAfter: "h1_3" }],
  },
];

// 확산 지표의 원천 = 팀 × 에이전트 실행 행렬 (최근 30일).
// 이 값으로 AuditLog(agent_run, deptSnapshot)를 만들며 에이전트 runs와 합계가 일치해야 한다.
export const SPREAD: Record<string, Record<string, number>> = {
  a1: { "디지털L&D센터": 8, 법무팀: 5, WM추진팀: 5, 해외주식팀: 5, 연금기획팀: 5, 디지털상품기획팀: 5, 경영관리팀: 5 },
  a2: { 법무팀: 20, 플랫폼개발팀: 4, WM추진팀: 6, "디지털L&D센터": 12 },
  a3: { 플랫폼개발팀: 32 },
  a4: { WM추진팀: 21, 법무팀: 8, 연금기획팀: 9, 경영관리팀: 7 },
  a5: { 해외주식팀: 20, 플랫폼개발팀: 8 },
  a6: { "디지털L&D센터": 26 },
  a7: { WM추진팀: 17, "디지털L&D센터": 10, 연금기획팀: 9 },
  a8: { 해외주식팀: 8, "디지털L&D센터": 6, 법무팀: 5, 플랫폼개발팀: 4, WM추진팀: 4, 연금기획팀: 5, IB1팀: 5, 상품전략팀: 5 },
  a9: { 연금기획팀: 34 },
  a10: { 해외주식팀: 18, "디지털L&D센터": 10 },
  a11: { 디지털상품기획팀: 32 },
  a12: { 플랫폼개발팀: 22, 법무팀: 6, 디지털상품기획팀: 6, IB1팀: 6, 경영관리팀: 5 },
  a13: { IB1팀: 15, 법무팀: 4, 경영관리팀: 11 },
  a14: { 상품전략팀: 19, WM추진팀: 11, 디지털상품기획팀: 6, IB1팀: 2 },
  a15: { 경영관리팀: 18, 해외주식팀: 8, 상품전략팀: 9 },
  a16: { 연금기획팀: 18, IB1팀: 8 },
  a17: { WM추진팀: 22, 법무팀: 11 },
  a18: { 법무팀: 10, "디지털L&D센터": 6, 해외주식팀: 6, 연금기획팀: 6, 디지털상품기획팀: 6, 경영관리팀: 6 },
  a19: { 경영관리팀: 24 },
  a20: { IB1팀: 16, 법무팀: 5, 상품전략팀: 10 },
  a21: { 플랫폼개발팀: 14, "디지털L&D센터": 4, 해외주식팀: 6, IB1팀: 5 },
  a22: { "디지털L&D센터": 15, 해외주식팀: 7 },
};

// 구독 현황 — 직전 월 조직 역량개발비 기준 (계정 수와 비용은 원 집계값 유지).
export const SUBSCRIPTION = {
  period: "2026-07",
  label: "26년 7월",
  note: "26년 7월 조직 역량개발비 구독 내역 기준 · 리서치센터·트레이딩(별도 예산) 미포함 · 연간 결제는 ÷12, 10개월 결제는 ÷10 으로 월 환산",
  totalUsers: 238,
  totalAccounts: 270,
  totalCostManwon: 1344,
  divisions: [
    { name: "디지털부문", users: 77, cost: 402, tools: { ChatGPT: 30, Gemini: 22, Claude: 16, Genspark: 5, 기타: 5 } },
    { name: "WM부문", users: 42, cost: 168, tools: { ChatGPT: 20, Gemini: 13, Claude: 7, Genspark: 2, 기타: 3 } },
    { name: "홀세일부문", users: 26, cost: 96, tools: { ChatGPT: 13, Gemini: 8, Claude: 4, Genspark: 1, 기타: 2 } },
    { name: "경영지원실", users: 21, cost: 78, tools: { ChatGPT: 10, Gemini: 7, Claude: 3, Genspark: 1, 기타: 2 } },
    { name: "IB부문", users: 18, cost: 68, tools: { ChatGPT: 8, Gemini: 5, Claude: 4, Genspark: 1, 기타: 1 } },
    { name: "상품전략실", users: 14, cost: 338, tools: { ChatGPT: 4, Gemini: 3, Claude: 12, Genspark: 1, 기타: 1 } },
    { name: "리스크관리실", users: 12, cost: 44, tools: { ChatGPT: 6, Gemini: 3, Claude: 3, Genspark: 1, 기타: 0 } },
    { name: "준법관리실", users: 11, cost: 82, tools: { ChatGPT: 8, Gemini: 6, Claude: 5, Genspark: 1, 기타: 2 } },
    { name: "전략기획실", users: 10, cost: 38, tools: { ChatGPT: 4, Gemini: 3, Claude: 3, Genspark: 1, 기타: 0 } },
    { name: "IT지원실", users: 7, cost: 30, tools: { ChatGPT: 2, Gemini: 2, Claude: 3, Genspark: 0, 기타: 3 } },
  ],
  teams: [
    { name: "디지털L&D센터", div: "디지털부문", users: 22, cost: 96, tools: { ChatGPT: 9, Gemini: 7, Claude: 5, Genspark: 2, 기타: 1 } },
    { name: "플랫폼개발팀", div: "디지털부문", users: 18, cost: 88, tools: { ChatGPT: 7, Gemini: 5, Claude: 6, Genspark: 1, 기타: 1 } },
    { name: "디지털상품기획팀", div: "디지털부문", users: 15, cost: 62, tools: { ChatGPT: 7, Gemini: 5, Claude: 2, Genspark: 1, 기타: 1 } },
    { name: "연금기획팀", div: "WM부문", users: 13, cost: 54, tools: { ChatGPT: 6, Gemini: 4, Claude: 2, Genspark: 1, 기타: 1 } },
    { name: "WM추진팀", div: "WM부문", users: 12, cost: 46, tools: { ChatGPT: 6, Gemini: 4, Claude: 2, Genspark: 0, 기타: 0 } },
    { name: "상품전략팀", div: "상품전략실", users: 9, cost: 228, tools: { ChatGPT: 2, Gemini: 2, Claude: 9, Genspark: 0, 기타: 1 } },
    { name: "해외주식팀", div: "홀세일부문", users: 9, cost: 34, tools: { ChatGPT: 4, Gemini: 3, Claude: 1, Genspark: 1, 기타: 0 } },
    { name: "법무팀", div: "준법관리실", users: 7, cost: 52, tools: { ChatGPT: 5, Gemini: 4, Claude: 3, Genspark: 1, 기타: 1 } },
    { name: "IB1팀", div: "IB부문", users: 8, cost: 32, tools: { ChatGPT: 4, Gemini: 2, Claude: 2, Genspark: 0, 기타: 0 } },
    { name: "경영관리팀", div: "경영지원실", users: 8, cost: 28, tools: { ChatGPT: 4, Gemini: 3, Claude: 1, Genspark: 0, 기타: 0 } },
  ],
};
