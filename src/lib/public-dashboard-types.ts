export type PublicDeptUsageRow = {
  dept: string;
  headcount: number | null;
  runs: number;
  registrations: number;
  activeUsers: number;
  activeUserRate: number | null;
  grouped: boolean;
};

export type PublicDashboardData = {
  periodDays: 7 | 30 | 90;
  filterDept: string | null;
  departmentOptions: string[];
  overview: {
    kpis: {
      totalContents: { value: number; delta: number | null };
      activeUsers: { value: number; delta: number | null };
      participatingDepartments: { value: number; delta: number | null };
      totalRuns: { value: number; delta: number | null };
    };
    totals: Omit<PublicDeptUsageRow, "dept" | "grouped">;
    departments: PublicDeptUsageRow[];
  };
  trend: Array<{
    month: string;
    label: string;
    newRegistrations: number;
    adoptions: number;
    activeUsers: number;
  }>;
  categories: Array<{
    category: string;
    registrations: number;
    adoptions: number;
    uniqueUsers: number;
  }>;
  diffusion: {
    contents: Array<{
      contentId: string;
      contentType: "prompt" | "agent";
      title: string;
      category: string;
      ownerDept: string;
      executionDeptCount: number;
      crossDeptRuns: number;
    }>;
    departments: Array<{
      dept: string;
      externalConsumerDeptCount: number;
      importedRuns: number;
    }>;
  };
  popularContent: Array<{
    contentId: string;
    contentType: "prompt" | "agent";
    title: string;
    category: string;
    runs: number;
  }>;
  subscriptions: {
    referenceMonth: string | null;
    rows: Array<{
      dept: string;
      tool: string;
      accounts: number;
      monthlyCostKrw: number;
    }>;
  };
};
