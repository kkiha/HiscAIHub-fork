// 기획서 4.2 — 업무 카테고리 5종과 실행 방식 4종.
// 등록 폼·생성 폼·필터가 같은 목록을 봐야 해서 한곳에 둔다.
// (카테고리는 관리자 콘솔에서 편집 가능하지만, 폼 기본값은 이 목록을 쓴다.)
// [SQLITE] PostgreSQL 복귀 시: RunType을 @prisma/client에서 import한다.
import type { RunType } from "./domain-values";

export const CATEGORY_GUIDE = [
  {
    value: "조사·수집",
    label: "조사·수집",
    desc: "흩어진 정보를 모아 가져옵니다",
    examples: ["경쟁사 수수료 모니터", "실적발표 스캔"],
  },
  {
    value: "작성·요약",
    label: "작성·요약",
    desc: "문서·답변을 만들거나 줄입니다",
    examples: ["회의록 정리", "심사자료 초안", "민원 1차 답변"],
  },
  {
    value: "번역·교정",
    label: "번역·교정",
    desc: "언어나 문체를 다듬습니다",
    examples: ["영문 공시 번역", "보고서 문체 정리"],
  },
  {
    value: "분석·진단",
    label: "분석·진단",
    desc: "데이터에서 원인이나 패턴을 찾습니다",
    examples: ["이탈 점검", "예산 이상치", "장애 로그 진단"],
  },
  {
    value: "점검·대조",
    label: "점검·대조",
    desc: "기준과 맞는지 확인합니다",
    examples: ["약관 조항 대조", "마감 데이터 정합성"],
  },
] as const;

export type Category = (typeof CATEGORY_GUIDE)[number]["value"];

type GuideValues<T extends readonly { value: string }[]> = {
  readonly [K in keyof T]: T[K] extends { value: infer V } ? V : never;
};

function guideValues<const T extends readonly { value: string }[]>(guide: T): GuideValues<T> {
  return guide.map((item) => item.value) as unknown as GuideValues<T>;
}

// CATEGORY_GUIDE에서 파생한 readonly tuple이라 목록과 설명이 따로 어긋날 수 없다.
export const CATEGORIES = guideValues(CATEGORY_GUIDE);

export const RUN_TYPES: { value: RunType; label: string; desc: string }[] = [
  { value: "schedule", label: "자동 실행 (스케줄)", desc: "정해진 시각에 스스로 돌고 결과만 받아봅니다" },
  { value: "event", label: "사내 시스템 연동", desc: "시스템에 붙어 조회·등록까지 직접 수행합니다" },
  { value: "skill", label: "내 PC에 설치", desc: "설정 파일을 넣으면 Claude가 파일·도구를 직접 다룹니다" },
  { value: "app", label: "웹·메신저에서 사용", desc: "배포된 주소나 봇을 불러 바로 씁니다" },
];

export const RUN_ACTION: Record<RunType, { label: string; toast: string }> = {
  schedule: { label: "지금 한 번 실행", toast: "설치된 PC에서 즉시 1회 실행됩니다 (다음 정기 실행은 그대로 유지)" },
  event: { label: "연결 신청", toast: "담당 부서 연결 신청 폼이 열립니다" },
  skill: { label: "설치 안내 보기", toast: "아래 사용 순서를 따라 설치하세요" },
  app: { label: "바로가기 열기", toast: "사내망에서 열리는 주소입니다" },
};

export function runTypeLabel(t: RunType): string {
  return RUN_TYPES.find((r) => r.value === t)?.label ?? String(t);
}
