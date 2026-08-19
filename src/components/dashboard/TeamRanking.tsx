import { Fragment } from "react";
import type { SpreadRow, TeamRow } from "@/lib/dashboard";

/** 그 팀이 실행한 에이전트 — 확산 행렬(에이전트 × 팀)을 팀 기준으로 뒤집어 만든다. */
function agentsRunBy(team: string, spread: SpreadRow[]) {
  return spread
    .flatMap((s) => {
      const hit = s.byTeam.find((t) => t.team === team);
      return hit ? [{ id: s.id, name: s.name, runs: hit.runs, own: s.ownerTeam === team }] : [];
    })
    .sort((a, b) => b.runs - a.runs);
}

function DeltaCell({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: "var(--text-3)" }}>—</span>;
  return (
    <span className={`delta ${value >= 0 ? "up" : "down"}`}>
      {value >= 0 ? "+" : ""}
      {value}%
    </span>
  );
}

export default function TeamRanking({
  teams,
  spread,
  openTeam,
  onToggle,
}: {
  teams: TeamRow[];
  spread: SpreadRow[];
  openTeam: string | null;
  onToggle: (team: string) => void;
}) {
  if (!teams.length) {
    return <div className="panel-sub">이 기간에는 집계된 활동이 없어요.</div>;
  }

  return (
    <table className="lb-table">
      <thead>
        <tr>
          <th>순위</th>
          <th>팀</th>
          <th>실행</th>
          <th>활성 인원</th>
          <th>인당 실행</th>
          <th>등록</th>
          <th>전기간 대비</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((r, i) => {
          const badge = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
          const open = openTeam === r.team;
          const list = open ? agentsRunBy(r.team, spread) : [];
          const max = list[0]?.runs ?? 0;

          return (
            <Fragment key={r.team}>
              <tr className="clickable" onClick={() => onToggle(r.team)}>
                <td>
                  <span className={`rank-badge ${badge}`}>{i + 1}</span>
                </td>
                <td className="td-team">
                  <span className="caret">{open ? "▾" : "▸"}</span> {r.team}
                  {r.division && <small>{r.division}</small>}
                </td>
                <td>{r.runs}</td>
                <td>{r.activeUsers}</td>
                <td>{r.avgRunsPerUser.toFixed(1)}</td>
                <td>{r.registrations}</td>
                <td>
                  <DeltaCell value={r.delta} />
                </td>
              </tr>
              {open && (
                <tr>
                  <td className="drill-td" colSpan={7}>
                    <div className="howto-sub" style={{ marginBottom: 8 }}>
                      {r.team}이(가) 실행한 에이전트
                    </div>
                    {list.length === 0 ? (
                      <div className="panel-sub" style={{ margin: 0 }}>
                        실행 기록이 남은 에이전트가 없어요.
                      </div>
                    ) : (
                      list.map((a) => (
                        <div className="drill-row" key={a.id}>
                          <span className="dr-name" style={{ width: 230 }}>
                            {a.name}
                            {a.own && <span className="own-tag">우리 팀 등록</span>}
                          </span>
                          <span className="dr-bar">
                            <i style={{ width: `${(a.runs / max) * 100}%` }} />
                          </span>
                          <span className="dr-num">{a.runs}회</span>
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
