// 구독 도구 표기 순서·색. ppt 확정값 — 대시보드 범례와 스택 막대가 같은 순서를 써야 읽힌다.
//
// lib/subscriptions.ts 가 아니라 이 파일에 두는 이유: 저 모듈은 db를 import 하므로
// 클라이언트 컴포넌트가 값을 가져오면 Prisma가 번들에 딸려 들어간다. 상수만 분리해 둔다.
export const TOOL_ORDER = ["ChatGPT", "Gemini", "Claude", "Genspark", "기타"] as const;

export const TOOL_COLORS: Record<string, string> = {
  ChatGPT: "#5E8F7A",
  Gemini: "#7C93BF",
  Claude: "#D96A28",
  Genspark: "#9B87B0",
  기타: "#B9B5AC",
};

// 팀·개인 랭킹 도넛/칩 색 램프. 6위까지 오렌지 계열, 그 뒤는 무채색.
const RANK_RAMP = ["#8A3D12", "#B85820", "#D96A28", "#E59460", "#F0BB99", "#F8DDCA"];

export function rampColor(i: number): string {
  return i < RANK_RAMP.length ? RANK_RAMP[i] : "#D8D5CE";
}
