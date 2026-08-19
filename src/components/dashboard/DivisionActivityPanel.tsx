import type { DivisionActivityRow } from "@/lib/dashboard";

type Props = {
  rows: DivisionActivityRow[];
  averageRate: number | null;
};

function percentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function DivisionActivityPanel({ rows, averageRate }: Props) {
  const maxRate = Math.max(0, ...rows.flatMap((row) => (row.activeRate == null ? [] : [row.activeRate])));
  const averageText = averageRate == null ? "—" : percentage(averageRate);
  const averagePosition =
    averageRate == null || maxRate === 0
      ? null
      : Math.min(100, Math.max(0, (averageRate / maxRate) * 100));

  return (
    <>
      <div className="division-activity-legend">
        <span>
          <i aria-hidden="true" />
          전사 평균 {averageText}
        </span>
      </div>

      <div className="division-activity-chart">
        <div className="division-activity-labels">
          {rows.map((row) => (
            <div className="division-activity-label" key={row.division}>
              <div>{row.division}</div>
              <small>
                활성 {row.activeUsers}명 / {row.headcount == null ? "총원 미등록" : `${row.headcount}명`}
              </small>
            </div>
          ))}
        </div>

        <div className="division-activity-tracks">
          {averagePosition != null && (
            <i
              aria-label={`전사 평균 ${averageText}`}
              className="division-activity-average"
              style={{ left: `${averagePosition}%` }}
            />
          )}
          {rows.map((row) => (
            <div className="division-activity-track-row" key={row.division}>
              {row.activeRate != null && (
                <div className="division-activity-track">
                  <i
                    style={{ width: `${maxRate === 0 ? 0 : (row.activeRate / maxRate) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="division-activity-values">
          {rows.map((row) => (
            <div className="division-activity-value" key={row.division}>
              {row.activeRate == null ? "—" : percentage(row.activeRate)}
            </div>
          ))}
        </div>
      </div>

      <div className="sub-note">
        허브에서 에이전트를 실행한 인원 기준이에요.
        <br />
        허브를 거치지 않은 개인 AI 사용은 집계되지 않습니다.
      </div>
    </>
  );
}
