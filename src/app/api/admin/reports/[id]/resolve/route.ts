import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { resolveReport } from "@/lib/admin";
import { isReportAction } from "@/lib/domain-values";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = String(body.action ?? "");
  if (!isReportAction(action)) {
    return NextResponse.json({ error: "잘못된 처리 유형입니다." }, { status: 400 });
  }

  await resolveReport(id, action);
  return NextResponse.json({ ok: true });
}
