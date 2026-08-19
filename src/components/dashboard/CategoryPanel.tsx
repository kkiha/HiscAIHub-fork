import type { CategoryRow } from "@/lib/dashboard";

/** 업무 유형별 등록·실행. 실행이 0인 카테고리는 아직 쓰이지 않은 영역이라 그대로 남겨 보여준다. */
export default function CategoryPanel({
  rows,
  savedHours,
}: {
  rows: CategoryRow[];
  savedHours: number;
}) {
  const maxRuns = Math.max(...rows.map((r) => r.runs), 0) || 1;
  const maxRegs = Math.max(...rows.map((r) => r.registrations), 0) || 1;

  return (
    <>
      <div className="cat-legend">
        <span>
          <i style={{ background: "var(--org)" }} />
          실행
        </span>
        <span>
          <i style={{ background: "#C9C6BE" }} />
          등록
        </span>
      </div>

      <div className="cat-rows">
        {rows.map((r) => (
          <div className="cat-row" key={r.cat}>
            <div className="nm">{r.cat}</div>
            <div className="bar-group">
              <div className="bar">
                <i className="run" style={{ width: `${(r.runs / maxRuns) * 100}%` }} />
              </div>
              <div className="bar sub">
                <i className="reg" style={{ width: `${(r.registrations / maxRegs) * 100}%` }} />
              </div>
            </div>
            <div className="nums">
              실행 {r.runs} · 등록 {r.registrations}
            </div>
          </div>
        ))}
      </div>

      <div className="sub-note">
        누적 절감 시간{" "}
        <b style={{ color: "var(--text-1)", fontSize: 15 }}>{savedHours}시간</b>
        <span className="est-tag">추정</span>
        <br />
        등록자가 고른 시간 구간의 중앙값 차이 × 실행 횟수로 계산한 값이에요.
      </div>
    </>
  );
}
