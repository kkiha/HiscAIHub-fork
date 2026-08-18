// [SQLITE] Json 컬럼과 string[] 사이를 변환한다.
// PostgreSQL 복귀 시: 이 파일을 삭제하고 호출부에서 직접 배열을 읽고 쓴다.

export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

export function fromStringList(list: string[]): string[] {
  return list.filter((item) => typeof item === "string" && item.trim().length > 0);
}
