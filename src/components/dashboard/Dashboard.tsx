"use client";

import { useEffect, useState } from "react";
import type { DashboardData, Period } from "@/lib/dashboard";
import type { SubscriptionDTO } from "@/lib/subscriptions";
import KpiStrip from "./KpiStrip";
import TeamShare from "./TeamShare";
import TeamRanking from "./TeamRanking";
import DivisionActivityPanel from "./DivisionActivityPanel";
import SpreadPanel from "./SpreadPanel";
import CategoryPanel from "./CategoryPanel";
import SubscriptionSection from "./SubscriptionSection";

const PERIODS: Period[] = [7, 30, 90];

/**
 * 전 임직원 공개 대시보드(기획서 4.7). 관리자 구분 없이 누구나 같은 화면을 본다.
 * 활용도(허브 내부 집계)와 구독 현황(외부 수동 스냅샷)을 한 탭에 세로로 둔다.
 */
export default function Dashboard() {
  const [days, setDays] = useState<Period>(30);
  // 어느 기간의 응답인지 함께 들고 있어야, 기간을 바꾼 직후 이전 수치가 새 라벨 아래 남지 않는다.
  const [usage, setUsage] = useState<{ days: Period; data: DashboardData } | null>(null);
  const [subs, setSubs] = useState<SubscriptionDTO | null>(null);
  const [subsLoaded, setSubsLoaded] = useState(false);
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [openSpread, setOpenSpread] = useState<string | null>(null);

  // 기간을 빠르게 바꾸면 앞선 응답이 늦게 도착해 표와 기간 라벨이 어긋날 수 있어,
  // 취소 플래그로 마지막 요청만 반영한다.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard?days=${days}`)
      .then((r) => r.json())
      .then((data: DashboardData) => {
        if (!cancelled) setUsage({ days, data });
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  // 구독 현황은 기간과 무관한 월 스냅샷이라 한 번만 불러온다.
  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((d: { subscriptions: SubscriptionDTO | null }) => {
        setSubs(d.subscriptions);
        setSubsLoaded(true);
      });
  }, []);

  // 펼쳐 둔 행은 기간이 바뀌면 다른 수치가 되므로 접는다.
  function changeDays(d: Period) {
    setDays(d);
    setOpenTeam(null);
    setOpenSpread(null);
  }

  const data = usage?.data;

  return (
    <>
      <div className="dash-sec">
        <div className="dash-sec-head">
          <div>
            <h3>팀 · 임직원 활용도</h3>
            <p>
              허브에서 발생한 활동입니다. 타팀까지 퍼진 에이전트는 게시된 전체 에이전트 중, 선택
              기간에 등록 팀이 아닌 팀에서 1회 이상 실행된 건수입니다. 에이전트당 평균 실행 팀은
              선택 기간에 1회 이상 실행된 에이전트만 대상으로 합니다.
            </p>
          </div>
          <div className="range-toggle">
            {PERIODS.map((d) => (
              <button key={d} className={days === d ? "on" : ""} onClick={() => changeDays(d)}>
                최근 {d}일
              </button>
            ))}
          </div>
        </div>

        {!data ? (
          <div className="dash-panel">
            <div className="panel-sub" style={{ margin: 0 }}>
              불러오는 중...
            </div>
          </div>
        ) : (
          <>
            <KpiStrip kpis={data.kpis} />

            <div className="dash-panel" style={{ marginBottom: 14 }}>
              <div className="panel-head">부문별 허브 활성률</div>
              <div className="panel-sub">
                선택 기간에 허브에서 에이전트를 실행한 인원을 부문 총원과 비교합니다.
              </div>
              <DivisionActivityPanel
                rows={data.divisionActivity.rows}
                averageRate={data.divisionActivity.averageRate}
              />
            </div>

            <div className="dash-panel" style={{ marginBottom: 14 }}>
              <div className="panel-head">팀별 활동 비중</div>
              <div className="panel-sub">전체 실행 중 팀별 비중이에요.</div>
              <TeamShare teams={data.teams} />
            </div>

            <div className="dash-panel" style={{ marginBottom: 14 }}>
              <div className="panel-head">팀별 활동 랭킹</div>
              <div className="panel-sub">행을 누르면 그 팀이 실행한 에이전트를 볼 수 있어요.</div>
              <TeamRanking
                teams={data.teams}
                spread={data.spread}
                openTeam={openTeam}
                onToggle={(t) => setOpenTeam(openTeam === t ? null : t)}
              />
            </div>

            <div className="dash-panel" style={{ marginBottom: 14 }}>
              <div className="panel-head">에이전트 확산</div>
              <div className="panel-sub">
                에이전트가 만든 팀 밖으로 얼마나 퍼졌는지예요. 막대는 이 에이전트를 실행한 팀
                수입니다. 행을 누르면 어느 팀이 몇 번 실행했는지 펼쳐집니다.
              </div>
              <SpreadPanel
                spread={data.spread}
                totalTeams={data.teams.length}
                openId={openSpread}
                onToggle={(id) => setOpenSpread(openSpread === id ? null : id)}
              />
              <div className="sub-note">
                실행은 「가져다 쓰기」 버튼을 누른 시점 기준이에요. 내 PC 설치·웹/메신저 방식은 이후
                실제 사용까지는 집계하지 않습니다.
              </div>
            </div>

            <div className="dash-panel">
              <div className="panel-head">업무 유형별 등록 · 실행</div>
              <div className="panel-sub">
                등록 시 고른 카테고리 기준이에요. 실행이 0인 카테고리는 아직 쓰이지 않은
                영역입니다.
              </div>
              <CategoryPanel rows={data.byCategory} savedHours={data.savedHours} />
            </div>
          </>
        )}
      </div>

      {subsLoaded && <SubscriptionSection data={subs} />}
    </>
  );
}
