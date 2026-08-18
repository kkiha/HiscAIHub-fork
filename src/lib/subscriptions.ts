// 구독 현황 — 조직 역량개발비 지원 내역 기준. 허브 활동이 아니라 외부 데이터라서
// 플랫폼이 자동 수집하지 않고 매월 수동으로 스냅샷을 적재한다(운영 정책 7장).
// 화면은 항상 가장 최근 스냅샷을 읽고, 과거 월은 추이 확인용으로 남겨 둔다.
import { db } from "./db";
import { getDivisionHeadcounts, rate } from "./headcount";

// 도구 표기 순서·색은 클라이언트 컴포넌트도 쓰므로 db를 물지 않는 모듈에 두고 여기서 다시 내보낸다.
export { TOOL_ORDER, TOOL_COLORS } from "./subscription-tools";

export type SubscriptionRowDTO = {
  name: string;
  division: string | null;
  users: number;
  costManwon: number;
  tools: Record<string, number>;
  accounts: number;
  headcount: number | null;
  adoptionRate: number | null;
};

export type SubscriptionDTO = {
  period: string;
  label: string;
  note: string;
  totals: { users: number; accounts: number; costManwon: number };
  divisions: SubscriptionRowDTO[];
  teams: SubscriptionRowDTO[];
};

function toolCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [tool, n] of Object.entries(value as Record<string, unknown>)) {
    const count = Number(n);
    if (Number.isFinite(count) && count > 0) out[tool] = count;
  }
  return out;
}

/** 가장 최근 스냅샷. 아직 한 번도 적재하지 않았으면 null — 화면은 안내 문구를 띄운다. */
export async function getLatestSubscriptions(): Promise<SubscriptionDTO | null> {
  const [snapshot, headcounts] = await Promise.all([
    db.subscriptionSnapshot.findFirst({
      orderBy: { period: "desc" },
      include: { rows: { orderBy: { order: "asc" } } },
    }),
    getDivisionHeadcounts(),
  ]);
  if (!snapshot) return null;

  const toDTO = (r: (typeof snapshot.rows)[number]): SubscriptionRowDTO => {
    const tools = toolCounts(r.tools);
    const headcount = r.scope === "division" ? (headcounts[r.name] ?? null) : null;
    return {
      name: r.name,
      division: r.division,
      users: r.users,
      costManwon: r.costManwon,
      tools,
      // 계정 수 = 도구별 계정 합. 한 사람이 여러 도구를 구독하므로 users와 다르다.
      accounts: Object.values(tools).reduce((sum, n) => sum + n, 0),
      headcount,
      // 보급률의 분자는 계정 수가 아니라 실제 이용 인원이다.
      adoptionRate: rate(r.users, headcount),
    };
  };

  return {
    period: snapshot.period,
    label: snapshot.label,
    note: snapshot.note,
    totals: {
      users: snapshot.totalUsers,
      accounts: snapshot.totalAccounts,
      costManwon: snapshot.totalCostManwon,
    },
    divisions: snapshot.rows.filter((r) => r.scope === "division").map(toDTO),
    teams: snapshot.rows.filter((r) => r.scope === "team").map(toDTO),
  };
}

/** 적재된 스냅샷 기간 목록 (최신순). 화면의 기준월 선택에 쓴다. */
export async function listSubscriptionPeriods(): Promise<{ period: string; label: string }[]> {
  return db.subscriptionSnapshot.findMany({
    orderBy: { period: "desc" },
    select: { period: true, label: true },
  });
}
