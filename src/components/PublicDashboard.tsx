"use client";

import { useEffect, useState } from "react";
import { logout } from "@/app/actions/auth";
import { BulbIcon, GridIcon } from "@/components/icons";
import type { PublicDashboardData } from "@/lib/public-dashboard-types";

const PERIODS = [7, 30, 90] as const;

function formatRate(value: number | null): string {
  return value === null ? "-" : `${value}%`;
}

function formatRunsPerHeadcount(runs: number, headcount: number | null): string {
  return headcount === null || headcount < 1 ? "-" : `${(runs / headcount).toFixed(1)}회`;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-empty">{children}</div>;
}

function KpiComparison({
  label,
  value,
  unit,
  delta,
}: {
  label: string;
  value: number;
  unit: string;
  delta: number | null;
}) {
  const direction = delta === null ? "neutral" : delta > 0 ? "up" : delta < 0 ? "down" : "neutral";
  const comparison = delta === null
    ? "-"
    : `${delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} ${Math.abs(delta)}%`;

  return (
    <div className="kpi-comparison">
      <p className="kpi-period-value">선택 기간: {label} {value}{unit}</p>
      <p className={`kpi-delta ${direction}`}>직전 동일 기간 대비 {comparison}</p>
    </div>
  );
}

function TrendChart({ rows }: { rows: PublicDashboardData["trend"] }) {
  const width = 960;
  const height = 300;
  const padding = { top: 25, right: 22, bottom: 48, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.newRegistrations, row.adoptions, row.activeUsers]));
  const x = (index: number) => padding.left + (rows.length <= 1 ? plotWidth / 2 : (index / (rows.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthInProgress = rows.at(-1)?.month === currentMonth;
  const series = [
    { key: "newRegistrations" as const, label: "신규 등록", color: "#D96A28" },
    { key: "adoptions" as const, label: "가져가기", color: "#3F6C79" },
    { key: "activeUsers" as const, label: "활성 사용자", color: "#7A6B52" },
  ];

  return (
    <div className="trend-chart" role="img" aria-label="최근 6개월 신규 등록, 가져가기, 활성 사용자 추이 차트">
      <div className="chart-legend">
        {series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {[0, 1, 2, 3, 4].map((step) => {
          const value = Math.round((maxValue * (4 - step)) / 4);
          const lineY = padding.top + (plotHeight * step) / 4;
          return (
            <g key={step}>
              <line x1={padding.left} x2={width - padding.right} y1={lineY} y2={lineY} className="chart-grid-line" />
              <text x={padding.left - 10} y={lineY + 4} textAnchor="end" className="chart-axis-label">{value}</text>
            </g>
          );
        })}
        {rows.map((row, index) => {
          const inProgress = lastMonthInProgress && index === rows.length - 1;
          return (
            <text key={row.month} x={x(index)} y={height - 17} textAnchor={inProgress ? "end" : "middle"} className={`chart-axis-label month${inProgress ? " in-progress" : ""}`}>
              {row.label.replace(/^\d{4}년 /, "")}{inProgress ? " (진행 중)" : ""}
            </text>
          );
        })}
        {series.map((item) => {
          const completedRows = lastMonthInProgress ? rows.slice(0, -1) : rows;
          const completedPoints = completedRows.map((row, index) => `${x(index)},${y(row[item.key])}`).join(" ");
          const lastIndex = rows.length - 1;
          return (
            <g key={item.key}>
              <polyline points={completedPoints} fill="none" stroke={item.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {lastMonthInProgress && rows.length > 1 ? (
                <line
                  x1={x(lastIndex - 1)}
                  y1={y(rows[lastIndex - 1][item.key])}
                  x2={x(lastIndex)}
                  y2={y(rows[lastIndex][item.key])}
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray="8 7"
                  strokeLinecap="round"
                />
              ) : null}
              {rows.map((row, index) => (
                <circle key={row.month} cx={x(index)} cy={y(row[item.key])} r="4" fill="var(--surface)" stroke={item.color} strokeWidth="2.5">
                  <title>{`${row.label} ${item.label}: ${row[item.key]}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CategoryBars({ rows }: { rows: PublicDashboardData["categories"] }) {
  const maxAdoptions = Math.max(1, ...rows.map((row) => row.adoptions));
  return (
    <div className="category-bars" aria-label="업무 카테고리별 가져가기 분포">
      <div className="category-bars-head"><span>업무유형</span><span>가져가기 분포</span><span>등록 / 고유 사용자</span></div>
      {rows.map((row) => (
        <div className="category-bar-row" key={row.category}>
          <b>{row.category}</b>
          <div className="category-bar-value">
            <div className="category-bar-track"><i style={{ width: `${(row.adoptions / maxAdoptions) * 100}%` }} /></div>
            <strong>{row.adoptions}<small>회</small></strong>
          </div>
          <span><em>등록 {row.registrations}건</em><em>고유 사용자 {row.uniqueUsers}명</em></span>
        </div>
      ))}
    </div>
  );
}

export default function PublicDashboard() {
  const [view, setView] = useState<"usage" | "subscriptions">("usage");
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [dept, setDept] = useState("");
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [data, setData] = useState<PublicDashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ days: String(days) });
    if (dept) params.set("dept", dept);
    setData(null);
    setError("");

    fetch(`/api/dashboard?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "대시보드를 불러오지 못했습니다.");
        return body as PublicDashboardData;
      })
      .then((body) => {
        setData(body);
        setDepartmentOptions(body.departmentOptions);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "대시보드를 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, [days, dept]);

  return (
    <div className="public-dashboard">
      <header className="dashboard-topbar">
        <a className="dashboard-brand" href="/">
          <span className="logo-sq"><BulbIcon size={13} stroke="#fff" /></span>
          AI 공유 허브 <span>· 한화투자증권</span>
        </a>
        <div className="dashboard-nav">
          <a href="/"><GridIcon size={14} /> 콘텐츠 탐색</a>
          <form action={logout}><button type="submit">로그아웃</button></form>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <h1>AI 활용 대시보드</h1>
            <p>부서별 콘텐츠 등록과 실행 흐름을 통해 사내 AI 활용 현황을 확인합니다.</p>
          </div>
          <div className="dashboard-filters" aria-label="대시보드 공통 필터">
            {view === "usage" ? (
              <div className="period-filter" aria-label="기간 선택">
                {PERIODS.map((period) => (
                  <button key={period} className={days === period ? "on" : ""} onClick={() => setDays(period)}>
                    {period}일
                  </button>
                ))}
              </div>
            ) : null}
            <label>
              <span>부서</span>
              <select value={dept} onChange={(event) => setDept(event.target.value)}>
                <option value="">전체</option>
                {departmentOptions.map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="dashboard-scope">
          {view === "usage" ? `주요 지표 최근 ${days}일 · 추이 최근 6개월 · ${dept || "전사"} 기준` : `${dept || "전사"} · 구독 기준월 데이터`}
        </div>
        <div className="dashboard-tabs">
          <button className={view === "usage" ? "on" : ""} onClick={() => setView("usage")}>AI 활용 현황</button>
          <button className={view === "subscriptions" ? "on" : ""} onClick={() => setView("subscriptions")}>AI 구독 현황</button>
        </div>

        {error ? <div className="dashboard-error">{error}</div> : null}
        {!data && !error ? <div className="dashboard-loading">대시보드를 불러오는 중입니다…</div> : null}

        {data ? (
          <>
            {view === "usage" ? (
              <>
            <section className="dashboard-section" id="overview">
              <div className="section-heading"><span>01</span><div><h2>현황</h2><p>누적 콘텐츠와 선택한 기간의 참여·활용 규모를 확인합니다.</p></div></div>
              <div className="overview-grid">
                <article>
                  <span>전체 등록 콘텐츠 수</span><strong>{data.overview.kpis.totalContents.value}<small>건</small></strong>
                  <KpiComparison label="신규 등록" value={data.overview.totals.registrations} unit="건" delta={data.overview.kpis.totalContents.delta} />
                </article>
                <article>
                  <span>활성 사용자 수</span><strong>{data.overview.kpis.activeUsers.value}<small>명</small></strong>
                  <KpiComparison label="활성 사용자" value={data.overview.kpis.activeUsers.value} unit="명" delta={data.overview.kpis.activeUsers.delta} />
                </article>
                <article>
                  <span>참여 부서 수</span><strong>{data.overview.kpis.participatingDepartments.value}<small>개</small></strong>
                  <KpiComparison label="참여 부서" value={data.overview.kpis.participatingDepartments.value} unit="개" delta={data.overview.kpis.participatingDepartments.delta} />
                </article>
                <article>
                  <span>전체 가져가기 수</span><strong>{data.overview.kpis.totalRuns.value}<small>회</small></strong>
                  <KpiComparison label="가져가기" value={data.overview.kpis.totalRuns.value} unit="회" delta={data.overview.kpis.totalRuns.delta} />
                </article>
              </div>
            </section>

            <section className="dashboard-section" id="trend">
              <div className="section-heading"><span>02</span><div><h2>추이</h2><p>최근 6개월</p></div></div>
              <TrendChart rows={data.trend} />
            </section>

            <section className="dashboard-section" id="categories">
              <div className="section-heading"><span>03</span><div><h2>업무유형</h2><p>어떤 업무에서 콘텐츠가 등록되고 활용되는지 확인합니다.</p></div></div>
              <CategoryBars rows={data.categories} />
            </section>

            <section className="dashboard-section" id="diffusion">
              <div className="section-heading"><span>04</span><div><h2>부서 확산</h2><p>부서별 활용 규모와 콘텐츠 확산 흐름을 함께 확인합니다.</p></div></div>
              <div className="dashboard-columns">
                <div className="dashboard-panel">
                  <h3>부서별 활용 현황</h3>
                  {data.overview.departments.length === 0 ? <Empty>표시할 부서 활동이 없습니다.</Empty> : (
                    <>
                      <div className="dashboard-table-wrap compact">
                        <table>
                          <thead><tr><th>부서</th><th>등록 인원</th><th>활성 사용자</th><th>활성률</th><th>가져가기</th><th>1인당 가져가기</th><th>등록</th></tr></thead>
                          <tbody>{data.overview.departments.map((row) => (
                            <tr key={row.dept}>
                              <td>{row.dept}{row.grouped ? <small className="grouped-label">10명 미만 부서 합산</small> : null}</td>
                              <td>{row.headcount === null ? "-" : `${row.headcount}명`}</td>
                              <td>{row.activeUsers}명</td><td>{formatRate(row.activeUserRate)}</td><td>{row.runs}회</td>
                              <td>{formatRunsPerHeadcount(row.runs, row.headcount)}</td><td>{row.registrations}건</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                      <p className="dashboard-footnote">* 등록은 건수가 적어 인원 대비 비율을 표시하지 않습니다.</p>
                    </>
                  )}
                  {data.overview.departments.some((row) => row.activeUserRate === null) ? (
                    <div className="dashboard-notice compact-notice">인원수가 등록되지 않은 부서는 활성률과 1인당 가져가기를 표시하지 않습니다.</div>
                  ) : null}
                </div>
                <div className="dashboard-panel">
                  <h3>타 부서 활용</h3>
                  <p className="panel-description">{data.filterDept ? "우리 부서가 등록한 콘텐츠 기준" : "각 부서가 등록한 콘텐츠 기준"}</p>
                  {data.diffusion.departments.length === 0 ? <Empty>부서 간 활용 기록이 없습니다.</Empty> : (
                    <div className="diffusion-list">
                      {data.diffusion.departments.map((row) => (
                        <div key={row.dept}><b>{row.dept}</b><span>외부 활용 부서 {row.externalConsumerDeptCount}곳</span><strong>타 부서 콘텐츠 실행 {row.importedRuns}회</strong></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="dashboard-panel content-diffusion">
                <h3>부서 간 확산 콘텐츠</h3>
                <p className="panel-description">{data.filterDept ? "우리 부서가 등록한 콘텐츠 기준" : "각 부서가 등록한 콘텐츠 기준"}</p>
                {data.diffusion.contents.filter((row) => row.crossDeptRuns > 0).length === 0 ? <Empty>이 기간에는 부서 간 실행 기록이 없습니다.</Empty> : (
                  <div className="dashboard-table-wrap compact">
                    <table>
                      <thead><tr><th>콘텐츠</th><th>유형</th><th>등록 부서</th><th>실행 부서</th><th>타 부서 실행</th></tr></thead>
                      <tbody>{data.diffusion.contents.filter((row) => row.crossDeptRuns > 0).slice(0, 8).map((row) => (
                        <tr key={`${row.contentType}-${row.contentId}`}><td>{row.title}</td><td>{row.contentType === "prompt" ? "프롬프트" : "에이전트"}</td><td>{row.ownerDept}</td><td>{row.executionDeptCount}곳</td><td>{row.crossDeptRuns}회</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="dashboard-section" id="popular">
              <div className="section-heading"><span>05</span><div><h2>인기 콘텐츠</h2><p>{data.filterDept ? "우리 부서가 실행한 콘텐츠 기준" : "전사 임직원이 실행한 콘텐츠 기준"} · 최근 {data.periodDays}일</p></div></div>
              <div className="popular-list">
                {data.popularContent.length === 0 ? <Empty>이 기간에는 실행된 콘텐츠가 없습니다.</Empty> : data.popularContent.map((row, index) => (
                  <article key={`${row.contentType}-${row.contentId}`}>
                    <span className="popular-rank">{index + 1}</span>
                    <div><span className="content-type">{row.contentType === "prompt" ? "프롬프트" : "에이전트"}</span><h3>{row.title}</h3><p>{row.category}</p></div>
                    <strong>{row.runs}<small>회 실행</small></strong>
                  </article>
                ))}
              </div>
            </section>
              </>
            ) : (
              <section className="dashboard-section subscriptions-section">
                <div className="section-heading"><span>별도</span><div><h2>팀별 AI 구독 현황</h2><p>조직 역량개발비 지원 내역을 기준으로 수동 관리하는 보조 자료입니다.</p></div></div>
                <div className="subscription-note">
                  기준월: <b>{data.subscriptions.referenceMonth ?? "미등록"}</b> · 플랫폼 자동 집계가 아닌 월 1회 갱신 데이터입니다.
                </div>
                {data.subscriptions.rows.length === 0 ? <Empty>선택한 부서의 구독 정보가 없습니다.</Empty> : (
                  <div className="dashboard-table-wrap">
                    <table>
                      <thead><tr><th>부서</th><th>AI 도구</th><th>구독 계정</th><th>월 비용</th></tr></thead>
                      <tbody>{data.subscriptions.rows.map((row) => (
                        <tr key={`${row.dept}-${row.tool}`}>
                          <td>{row.dept}</td><td>{row.tool}</td><td>{row.accounts}개</td><td>{row.monthlyCostKrw.toLocaleString("ko-KR")}원</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
