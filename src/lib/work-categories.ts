export const WORK_CATEGORIES = [
  "작성·요약",
  "조사·리서치",
  "분석",
  "번역·검토",
  "기획·아이디어",
  "자동화·개발",
] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export function isWorkCategory(value: string): value is WorkCategory {
  return (WORK_CATEGORIES as readonly string[]).includes(value);
}
