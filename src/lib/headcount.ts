// 부문별 총원. 조직 개편 시 코드 수정 없이 Setting 값만 교체하면 된다.
// 실제 조직 인원 확보 전까지는 시드의 목업 값이 들어간다.
import { db } from "./db";

export async function getDivisionHeadcounts(): Promise<Record<string, number>> {
  const setting = await db.setting.findUnique({ where: { key: "division_headcount" } });
  const value = setting?.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] >= 0,
    ),
  );
}

/** 분모가 없거나 0이면 null을 반환한다. 0%로 표시하면 오해를 부른다. */
export function rate(numerator: number, denominator: number | null): number | null {
  if (denominator == null || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}
