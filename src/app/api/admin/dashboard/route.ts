import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getDashboardStats } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const requestedDays = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const stats = await getDashboardStats(days);
  return NextResponse.json(stats);
}
