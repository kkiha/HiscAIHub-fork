"use client";

import { useEffect, useMemo, useState } from "react";
import { logout } from "@/app/actions/auth";
import { BulbIcon, GridIcon } from "@/components/icons";
import type { PublicDashboardData } from "@/lib/public-dashboard-types";

const PERIODS = [7, 30, 90] as const;

function formatRate(value: number | null): string {
  return value === null ? "-" : `${value}%`;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-empty">{children}</div>;
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

  const usageByDept = useMemo(
    () => new Map(data?.overview.departments.map((row) => [row.dept, row]) ?? []),
    [data],
  );

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
              <div className="section-heading"><span>01</span><div><h2>현황</h2><p>선택한 기간의 실행자와 신규 콘텐츠를 확인합니다.</p></div></div>
              <div className="overview-grid">
                <article><span>활성 사용자</span><strong>{data.overview.totals.activeUsers}<small>명</small></strong><p>기간 내 1회 이상 실행한 고유 사용자</p></article>
                <article><span>{data.filterDept ? "부서" : "전사"} 활성률</span><strong>{formatRate(data.overview.totals.activeUserRate)}</strong><p>활성 사용자 ÷ 등록 인원수</p></article>
                <article><span>콘텐츠 실행</span><strong>{data.overview.totals.runs}<small>회</small></strong><p>프롬프트와 에이전트 실행 합계</p></article>
                <article><span>신규 등록</span><strong>{data.overview.totals.registrations}<small>건</small></strong><p>프롬프트와 에이전트 등록 합계</p></article>
              </div>

              {data.overview.totals.activeUserRate === null ? (
                <div className="dashboard-notice">
                  {data.filterDept
                    ? `${data.filterDept}의 등록 인원수가 없어 활성률을 표시하지 않습니다.`
                    : "인원수가 등록되지 않은 부서가 있어 전사 활성률을 계산하지 않습니다. 부서별 절대 수치는 정상 집계됩니다."}
                </div>
              ) : null}

              <div className="dashboard-table-wrap">
                <table>
                  <thead><tr><th>부서</th><th>등록 인원</th><th>활성 사용자</th><th>활성률</th><th>실행</th><th>등록</th></tr></thead>
                  <tbody>
                    {data.overview.departments.map((row) => (
                      <tr key={row.dept}>
                        <td>{row.dept}{row.grouped ? <small className="grouped-label">10명 미만 부서 합산</small> : null}</td>
                        <td>{row.headcount === null ? "-" : `${row.headcount}명`}</td>
                        <td>{row.activeUsers}명</td>
                        <td>{formatRate(row.activeUserRate)}</td>
                        <td>{row.runs}회</td>
                        <td>{row.registrations}건</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dashboard-section" id="trend">
              <div className="section-heading"><span>02</span><div><h2>추이</h2><p>최근 6개월</p></div></div>
              <div className="trend-grid">
                {data.trend.map((row) => (
                  <article key={row.month}>
                    <h3>{row.label}</h3>
                    <dl>
                      <div><dt>신규 등록</dt><dd>{row.newRegistrations}건</dd></div>
                      <div><dt>가져가기</dt><dd>{row.adoptions}회</dd></div>
                      <div><dt>활성 사용자</dt><dd>{row.activeUsers}명</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section" id="categories">
              <div className="section-heading"><span>03</span><div><h2>업무유형</h2><p>어떤 업무에서 콘텐츠가 등록되고 활용되는지 확인합니다.</p></div></div>
              <div className="category-grid">
                {data.categories.map((row) => (
                  <article key={row.category}>
                    <h3>{row.category}</h3>
                    <div><span>등록</span><b>{row.registrations}</b><small>건</small></div>
                    <div><span>가져가기</span><b>{row.adoptions}</b><small>회</small></div>
                    <div><span>고유 사용자</span><b>{row.uniqueUsers}</b><small>명</small></div>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-section" id="diffusion">
              <div className="section-heading"><span>04</span><div><h2>부서 확산</h2><p>{data.filterDept ? "우리 부서가 등록한 콘텐츠 기준" : "전사 각 부서가 등록한 콘텐츠 기준"}</p></div></div>
              <div className="dashboard-columns">
                <div className="dashboard-panel">
                  <h3>부서별 활용 현황</h3>
                  {data.departmentLeaderboard.length === 0 ? <Empty>표시할 부서 활동이 없습니다.</Empty> : (
                    <div className="dashboard-table-wrap compact">
                      <table>
                        <thead><tr><th>부서</th><th>점수</th><th>실행</th><th>등록</th><th>활성률</th></tr></thead>
                        <tbody>{data.departmentLeaderboard.map((row) => (
                          <tr key={row.dept}>
                            <td>{row.dept}</td><td>{row.score}</td><td>{row.runs}</td><td>{row.registrations}</td>
                            <td>{formatRate(usageByDept.get(row.dept)?.activeUserRate ?? null)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="dashboard-panel">
                  <h3>타 부서 활용</h3>
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
