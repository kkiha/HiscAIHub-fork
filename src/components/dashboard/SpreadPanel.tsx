import { useState } from "react";
import type { SpreadRow } from "@/lib/dashboard";

const INITIAL_ROW_LIMIT = 10;

/** 에이전트가 등록 팀 밖으로 얼마나 퍼졌는지. 퍼진 팀 수 → 타팀 비중 순으로 세운다. */
export default function SpreadPanel({
  spread,
  totalTeams,
  openId,
  onToggle,
}: {
  spread: SpreadRow[];
  totalTeams: number;
  openId: string | null;
  onToggle: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  if (!spread.length) {
    return <div className="panel-sub">이 기간에는 실행된 에이전트가 없어요.</div>;
  }

  const rows = [...spread].sort((a, b) => b.teams - a.teams || b.outsidePct - a.outsidePct);
  const hiddenCount = Math.max(0, rows.length - INITIAL_ROW_LIMIT);
  const visibleRows = showAll ? rows : rows.slice(0, INITIAL_ROW_LIMIT);

  return (
    <>
      {visibleRows.map((s) => {
        const open = openId === s.id;
        const preview =
          s.byTeam
            .slice(0, 2)
            .map((t) => t.team)
            .join(" · ") + (s.byTeam.length > 2 ? ` 외 ${s.byTeam.length - 2}팀` : "");
        const max = s.byTeam[0]?.runs ?? 0;
        const teamShare = totalTeams > 0 ? (s.teams / totalTeams) * 100 : 0;

        return (
          <div className="spread-row" key={s.id} onClick={() => onToggle(s.id)}>
            <div className="spread-head">
              <span className="caret">{open ? "▾" : "▸"}</span>
              <div className="spread-main">
                <div className="sp-name">{s.name}</div>
                <div className="sp-sub">{preview}</div>
              </div>
              <div className="sp-teams">
                전체 {totalTeams}팀 중 {s.teams}팀
              </div>
              <div className="sp-bar">
                <i style={{ width: `${teamShare}%` }} />
              </div>
            </div>
            {open && (
              <div className="drill">
                {s.byTeam.map((t) => (
                  <div className="drill-row" key={t.team}>
                    <span className="dr-name">
                      {t.team}
                      {t.owner && <span className="own-tag">등록 팀</span>}
                    </span>
                    <span className="dr-bar">
                      <i style={{ width: `${(t.runs / max) * 100}%` }} />
                    </span>
                    <span className="dr-num">{t.runs}회</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="spread-more"
          aria-expanded={showAll}
          onClick={() => setShowAll((value) => !value)}
        >
          나머지 {hiddenCount}건 {showAll ? "접기" : "더보기"}
        </button>
      )}
    </>
  );
}
