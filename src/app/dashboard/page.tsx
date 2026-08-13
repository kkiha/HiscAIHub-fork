import { redirect } from "next/navigation";
import PublicDashboard from "@/components/PublicDashboard";
import { getCurrentUser } from "@/lib/current-user";
import "@/styles/dashboard.css";

export const metadata = {
  title: "AI 활용 대시보드 · AI 공유 허브",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <PublicDashboard />;
}
