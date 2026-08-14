import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import {
  getCategoryStats,
  getAiSubscriptionStats,
  getDashboardDepartments,
  getDeptHeadcounts,
  getDeptUsageStats,
  getDiffusionStats,
  getMonthlyTrend,
  getPopularContentStats,
  getPublicOverviewKpis,
} from "@/lib/admin";
import type { PublicDashboardData } from "@/lib/public-dashboard-types";

const PERIODS = [7, 30, 90] as const;

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const requestedDays = Number(url.searchParams.get("days") ?? 30);
  const days = PERIODS.find((period) => period === requestedDays) ?? 30;
  const requestedDept = url.searchParams.get("dept")?.trim() || null;
  const [allDepartmentOptions, headcounts] = await Promise.all([
    getDashboardDepartments(),
    getDeptHeadcounts(),
  ]);
  const departmentOptions = allDepartmentOptions.filter((department) =>
    headcounts[department] === undefined || headcounts[department] >= 10,
  );

  if (requestedDept && !departmentOptions.includes(requestedDept)) {
    return NextResponse.json({ error: "존재하지 않는 부서입니다." }, { status: 400 });
  }

  const dept = requestedDept ?? undefined;
  const [overview, overviewKpis, trend, categories, diffusion, popularContent, subscriptions] = await Promise.all([
    getDeptUsageStats(days, dept),
    getPublicOverviewKpis(days, dept),
    getMonthlyTrend(6, dept),
    getCategoryStats(days, dept),
    getDiffusionStats(days, dept),
    getPopularContentStats(days, dept),
    getAiSubscriptionStats(dept),
  ]);

  // 공개 응답에는 부서 집계만 선별한다. 개인 랭킹과 파워 유저 데이터는 포함하지 않는다.
  const visibleDepartments = new Set(
    overview.departments.filter((row) => !row.grouped).map((row) => row.dept),
  );
  const publicDiffusionDepartments = diffusion.departments.filter((row) =>
    requestedDept ? row.dept === requestedDept : visibleDepartments.has(row.dept),
  );
  const publicDiffusionContents = diffusion.contents.filter((row) =>
    requestedDept ? row.ownerDept === requestedDept : visibleDepartments.has(row.ownerDept),
  );

  const response = {
    periodDays: days,
    filterDept: requestedDept,
    departmentOptions,
    overview: { kpis: overviewKpis, totals: overview.totals, departments: overview.departments },
    trend,
    categories,
    diffusion: { contents: publicDiffusionContents, departments: publicDiffusionDepartments },
    popularContent,
    subscriptions,
  } satisfies PublicDashboardData;

  return NextResponse.json(response);
}
