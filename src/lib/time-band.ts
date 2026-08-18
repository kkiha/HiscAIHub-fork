// 1회 처리 소요시간 구간 — 등록·후기 모두 "도입 전 / 도입 후"를 이 구간으로 받는다.
// 절감 시간을 등록자가 직접 추정하게 하면 사람마다 기준이 달라 집계가 안 되므로,
// 전/후 구간만 받고 절감률·절감 시간은 대표값(MID)으로 시스템이 계산한다.
// 서버(집계)와 클라이언트(폼·표시)가 같은 값을 써야 하므로 순수 모듈로 둔다.
// [SQLITE] PostgreSQL 복귀 시: TimeBand를 @prisma/client에서 import한다.
import type { TimeBand } from "./domain-values";

export type TimeBandInfo = { value: TimeBand; label: string; mid: number };

// mid = 구간 대표값(분). 절감 시간 합계 = (before.mid - after.mid) × 실행 횟수.
export const TIME_BANDS: TimeBandInfo[] = [
  { value: "under_10m", label: "10분 미만", mid: 5 },
  { value: "m10_30", label: "10~30분", mid: 20 },
  { value: "m30_60", label: "30분~1시간", mid: 45 },
  { value: "h1_3", label: "1~3시간", mid: 120 },
  { value: "h3_8", label: "3시간~1일", mid: 330 },
  { value: "over_1d", label: "1일 이상", mid: 600 },
];

const BY_VALUE = new Map(TIME_BANDS.map((b) => [b.value, b]));

export function bandInfo(v: TimeBand | null | undefined): TimeBandInfo | null {
  return v ? (BY_VALUE.get(v) ?? null) : null;
}

export function bandLabel(v: TimeBand | null | undefined): string {
  return bandInfo(v)?.label ?? "";
}

export function isTimeBand(v: unknown): v is TimeBand {
  return typeof v === "string" && BY_VALUE.has(v as TimeBand);
}

/** 폼 입력값을 TimeBand로 정규화. 빈 값("선택 안 함")은 null. */
export function parseTimeBand(v: unknown): TimeBand | null {
  return isTimeBand(v) ? v : null;
}

/** 절감률(%). 전/후 중 하나라도 없으면 null — 0%와 "모름"은 다르다. */
export function savedPct(before: TimeBand | null, after: TimeBand | null): number | null {
  const b = bandInfo(before);
  const a = bandInfo(after);
  if (!b || !a || b.mid <= 0) return null;
  return Math.round((1 - a.mid / b.mid) * 100);
}

/** 1회당 절감 시간(분). 후가 전보다 오래 걸리면 음수가 아니라 0으로 본다. */
export function savedMinutes(before: TimeBand | null, after: TimeBand | null): number {
  const b = bandInfo(before);
  const a = bandInfo(after);
  if (!b || !a) return 0;
  return Math.max(0, b.mid - a.mid);
}
