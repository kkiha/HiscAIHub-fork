import type { SubscriptionDTO, SubscriptionRowDTO } from "@/lib/subscriptions";
import { TOOL_COLORS, TOOL_ORDER } from "@/lib/subscription-tools";

function total(r: SubscriptionRowDTO): number {
  return TOOL_ORDER.reduce((sum, t) => sum + (r.tools[t] ?? 0), 0);
}

function SubRows({
  rows,
  showDivision,
  showHeadcount = false,
}: {
  rows: SubscriptionRowDTO[];
  showDivision: boolean;
  showHeadcount?: boolean;
}) {
  const max = Math.max(...rows.map(total), 0) || 1;

  return (
    <>
      {rows.map((r) => {
        const sum = total(r);
        const hasHeadcount = showHeadcount && r.headcount != null && r.adoptionRate != null;
        return (
          <div className="sub-row" key={r.name}>
            <div className="sub-label">
              <div className="nm">{r.name}</div>
              <div className="meta">
                {showDivision && r.division ? `${r.division} · ` : ""}
                이용 {r.users}
                {hasHeadcount ? ` / ${r.headcount}명 (${Math.round(r.adoptionRate!)}%)` : "명"} · 인당{" "}
                {r.users > 0 ? (sum / r.users).toFixed(1) : "0.0"}개 · 월{" "}
                {r.costManwon}만원
              </div>
            </div>
            <div className="sub-bar" style={{ maxWidth: `${(sum / max) * 100}%` }}>
              {TOOL_ORDER.map((t) => {
                const n = r.tools[t] ?? 0;
                if (!n) return null;
                const w = (n / sum) * 100;
                // 조각이 좁으면 숫자가 뭉개져서 뺀다
                return (
                  <div
                    className="sub-seg"
                    key={t}
                    style={{ width: `${w}%`, background: TOOL_COLORS[t] }}
                  >
                    {w >= 11 ? n : ""}
                  </div>
                );
              })}
            </div>
            <div className="sub-total">{sum}건</div>
          </div>
        );
      })}
    </>
  );
}

/**
 * 부서별 AI 사용 현황 — 허브 활동이 아니라 조직 역량개발비 구독 내역이다.
 * 자동 수집이 아니라 매월 수동으로 스냅샷을 적재한다(운영 정책 7장).
 */
export default function SubscriptionSection({ data }: { data: SubscriptionDTO | null }) {
  if (!data) {
    return (
      <div className="dash-sec">
        <div className="dash-sec-head">
          <div>
            <h3>부서별 AI 사용 현황</h3>
            <p>아직 등록된 구독 현황 데이터가 없어요. 매월 수동으로 갱신합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-sec">
      <div className="dash-sec-head">
        <div>
          <h3>부서별 AI 사용 현황</h3>
          <p>
            허브 활동이 아니라 조직 역량개발비 구독 내역 기준이에요. 매월 수동으로 갱신합니다. (
            {data.label} 기준)
          </p>
        </div>
      </div>

      <div className="dash-panel">
        <div className="sub-summary">
          <div>
            <b>{data.totals.users}명</b>이용 인원
          </div>
          <div>
            <b>{data.totals.accounts}건</b>구독 계정
          </div>
          <div>
            <b>{data.totals.costManwon.toLocaleString()}만원</b>월 구독료
          </div>
        </div>

        <div className="sub-legend">
          {TOOL_ORDER.map((t) => (
            <span key={t}>
              <i style={{ background: TOOL_COLORS[t] }} />
              {t}
            </span>
          ))}
        </div>

        <div className="panel-head" style={{ marginBottom: 10 }}>
          부문 · 실별 도구 구성
        </div>
        <SubRows rows={data.divisions} showDivision={false} showHeadcount />

        <div className="panel-head" style={{ margin: "24px 0 10px" }}>
          팀별 도구 구성{" "}
          <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 11 }}>
            — 이용 인원 상위 10팀
          </span>
        </div>
        <SubRows rows={data.teams.slice(0, 10)} showDivision />

        <div className="sub-note">{data.note}</div>
      </div>
    </div>
  );
}
