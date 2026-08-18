// design-reference/agent_hub_v3_mockup.html 의 목 데이터를 그대로 옮긴 시드 원본.
// 화면 확인용 데이터라 목업과 수치가 어긋나면 안 되므로, 값은 손대지 않고 형태만 DB 스키마에 맞춘다.
// [SQLITE] PostgreSQL 복귀 시: RunType, TimeBand를 @prisma/client에서 import한다.
import type { RunType, TimeBand } from "../src/lib/domain-values";

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

export const CATEGORIES = ["작성·요약", "조사·리서치", "분석", "번역·검토", "기획·아이디어", "자동화·개발"];

// 권다은 = 실제 로그인 테스트 계정. 나머지는 {given}.{family}@hanwha.com 패턴의 시드 전용 동료 계정.
export const USERS = [
  { name: "권다은", email: "202502035@hanwha.com", dept: "플랫폼개발팀", role: "user" as const },
  { name: "박소영", email: "soyoung.park@hanwha.com", dept: "디지털L&D센터", role: "mod" as const },
  { name: "한지우", email: "jiwoo.han@hanwha.com", dept: "디지털L&D센터", role: "user" as const },
  { name: "최민준", email: "minjun.choi@hanwha.com", dept: "법무팀", role: "mod" as const },
  { name: "이도현", email: "dohyun.lee@hanwha.com", dept: "WM추진팀", role: "user" as const },
  { name: "윤서연", email: "seoyeon.yoon@hanwha.com", dept: "해외주식팀", role: "user" as const },
  { name: "정하은", email: "haeun.jung@hanwha.com", dept: "디지털상품기획팀", role: "user" as const },
  { name: "강태양", email: "taeyang.kang@hanwha.com", dept: "연금기획팀", role: "user" as const },
];

// 팀 대표 사용자 — 확산 로그(팀별 실행)를 만들 때 그 팀 계정으로 기록한다.
export const TEAM_MEMBER: Record<string, string> = {
  플랫폼개발팀: "권다은",
  "디지털L&D센터": "박소영",
  법무팀: "최민준",
  WM추진팀: "이도현",
  해외주식팀: "윤서연",
  디지털상품기획팀: "정하은",
  연금기획팀: "강태양",
};

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
  cat: string;
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
    cat: "조사·리서치",
    name: "리서치 브리핑 자동 발송 에이전트",
    daysAgo: 9,
    desc: "매일 새벽에 리서치 포털을 스스로 돌며 전날 신규 리포트를 모아 팀 브리핑을 만들어 메일로 보냅니다.",
    author: "박소영",
    runs: 214,
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
    timeBefore: "h1_3",
    timeAfter: "under_10m",
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
    runs: 1180,
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
    timeAfter: "under_10m",
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
    cat: "자동화·개발",
    name: "월 마감 데이터 정합성 점검 에이전트",
    daysAgo: 6,
    desc: "마감 폴더의 엑셀 12종을 스스로 열어 회계시스템 값과 대조하고, 안 맞는 항목만 골라 점검 결과서를 만들어줍니다.",
    author: "권다은",
    runs: 96,
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
    timeBefore: "h3_8",
    timeAfter: "m10_30",
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
    cat: "번역·검토",
    name: "사내 규정 Q&A · 유권해석 접수 봇",
    daysAgo: 15,
    desc: "Teams에서 물어보면 근거 조항과 함께 답하고, 규정에 없는 건은 유권해석 요청까지 스스로 접수해줍니다.",
    author: "이도현",
    runs: 2340,
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
    cat: "기획·아이디어",
    name: "회의 녹취 → 회의록·할 일 자동 등록",
    daysAgo: 20,
    desc: "녹취 파일을 폴더에 넣어두면 회의록을 만들고, 액션아이템을 협업툴 할 일 보드에 카드로 직접 등록합니다.",
    author: "윤서연",
    runs: 141,
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
    timeAfter: "under_10m",
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
    cat: "분석",
    name: "신규 약관 조항 대조 검토 에이전트",
    daysAgo: 26,
    desc: "신규 상품 약관을 표준약관·과거 지적사례와 조항 단위로 대조해 봐야 할 조항만 추려줍니다.",
    author: "한지우",
    runs: 64,
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
];

// 확산 지표의 원천 = 팀 × 에이전트 실행 행렬 (최근 30일).
// 이 값으로 AuditLog(agent_run, deptSnapshot)를 만들어 대시보드가 목업과 같은 수치를 내게 한다.
export const SPREAD: Record<string, Record<string, number>> = {
  a4: { 법무팀: 78, "디지털L&D센터": 64, 연금기획팀: 54, 해외주식팀: 36, WM추진팀: 34, 디지털상품기획팀: 22 },
  a2: { 연금기획팀: 68, WM추진팀: 52, 법무팀: 35, 디지털상품기획팀: 25, 해외주식팀: 16 },
  a1: { "디지털L&D센터": 44, 연금기획팀: 34, 해외주식팀: 30, 디지털상품기획팀: 25, 플랫폼개발팀: 19 },
  a5: { 해외주식팀: 35, "디지털L&D센터": 22, 플랫폼개발팀: 17 },
  a3: { 플랫폼개발팀: 50, WM추진팀: 12 },
  a6: { "디지털L&D센터": 27 },
};

// 구독 현황 — 26년 5월 조직 역량개발비 기준 (ppt 집계값).
export const SUBSCRIPTION = {
  period: "2026-05",
  label: "26년 5월",
  note: "26년 5월 조직 역량개발비 구독 내역 기준 · 리서치센터·트레이딩(별도 예산) 미포함 · 연간 결제는 ÷12, 10개월 결제는 ÷10 으로 월 환산",
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
