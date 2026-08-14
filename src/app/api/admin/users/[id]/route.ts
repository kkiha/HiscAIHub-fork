import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { updateUserRole } from "@/lib/admin";
import { isUserRole } from "@/lib/domain-values";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const role = String(body.role ?? "");
  if (!isUserRole(role)) {
    return NextResponse.json({ error: "잘못된 역할입니다." }, { status: 400 });
  }

  const name = await updateUserRole(id, role);
  return NextResponse.json({ name, role });
}
