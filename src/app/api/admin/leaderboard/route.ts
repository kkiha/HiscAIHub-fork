import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getLeaderboardStats } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const days = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const stats = await getLeaderboardStats([7, 30, 90].includes(days) ? days : 30);
  return NextResponse.json(stats);
}
