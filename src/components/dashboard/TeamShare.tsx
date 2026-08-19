import { useState } from "react";
import type { TeamRow } from "@/lib/dashboard";
import { rampColor } from "@/lib/subscription-tools";

const R = 45;
const C = 2 * Math.PI * R;
const GAP = (C * 2.5) / 360; // 조각 사이 2.5°
const DONUT_TEAM_LIMIT = 6;
const INITIAL_ROW_LIMIT = 7;
const OTHER_COLOR = "#D8D5CE";

type DonutRow = Pick<TeamRow, "team" | "runs"> & { color: string };

function Donut({ rows, total, top }: { rows: DonutRow[]; total: number; top: TeamRow }) {
  // 조각의 시작 위치는 앞선 조각 길이의 누적합. 팀 수가 많지 않아 매번 앞을 더해도 충분하다.
  const lengths = rows.map((r) => C * (r.runs / total));

  const arcs = rows.map((r, i) => {
    const offset = lengths.slice(0, i).reduce((sum, n) => sum + n, 0);
    const draw = Math.max(lengths[i] - GAP, 0.5);
    return (
      <circle
        key={r.team}
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke={r.color}
        strokeWidth="18"
        strokeDasharray={`${draw.toFixed(2)} ${(C - draw).toFixed(2)}`}
        strokeDashoffset={(-offset).toFixed(2)}
      />
    );
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 120 120" width="168" height="168">
        <g transform="rotate(-90 60 60)">{arcs}</g>
      </svg>
      <div className="donut-center">
        <div className="pct">{Math.round((top.runs / total) * 100)}%</div>
        <div className="nm">{top.team}</div>
        <div className="cap">전체 실행 중 비중 1위</div>
      </div>
    </div>
  );
}

/** 팀별 활동 비중 — 도넛 + 순위 목록. */
export default function TeamShare({ teams }: { teams: TeamRow[] }) {
  const [showAll, setShowAll] = useState(false);

  // 실행 수 합이 0이면 비중을 낼 수 없다. 활동이 전혀 없는 기간을 방어한다.
  const total = teams.reduce((sum, r) => sum + r.runs, 0);
  if (!teams.length || total <= 0) {
    return <div className="panel-sub">이 기간에는 집계된 활동이 없어요.</div>;
  }

  const remainingTeams = teams.slice(DONUT_TEAM_LIMIT);
  const donutRows: DonutRow[] = teams.slice(0, DONUT_TEAM_LIMIT).map((team, index) => ({
    ...team,
    color: rampColor(index),
  }));
  if (remainingTeams.length > 0) {
    donutRows.push({
      team: `기타 ${remainingTeams.length}개 팀`,
      runs: remainingTeams.reduce((sum, team) => sum + team.runs, 0),
      color: OTHER_COLOR,
    });
  }

  const hiddenCount = Math.max(0, teams.length - INITIAL_ROW_LIMIT);
  const visibleTeams = showAll ? teams : teams.slice(0, INITIAL_ROW_LIMIT);

  return (
    <div className="donut-row">
      <Donut rows={donutRows} total={total} top={teams[0]} />
      <div className="rank-list">
        {visibleTeams.map((r, i) => (
          <div className="rank-item" key={r.team}>
            <span className="rank-chip" style={{ background: rampColor(i) }} />
            <span className="rank-no">{i + 1}</span>
            <div className="rank-main">
              <div className="rank-name">{r.team}</div>
              <div className="rank-sub">
                {r.division ? `${r.division} · ` : ""}
                등록 {r.registrations}건
              </div>
            </div>
            <div className="rank-score">{r.runs}</div>
            <div className="rank-share">{Math.round((r.runs / total) * 100)}%</div>
          </div>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="spread-more"
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
          >
            나머지 {hiddenCount}개 팀 {showAll ? "접기" : "더보기"}
          </button>
        )}
      </div>
    </div>
  );
}
