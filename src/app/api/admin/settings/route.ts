import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getSettingsAdmin, saveDeptHeadcounts, saveSettingsAdmin, updateSensitiveKeywords } from "@/lib/admin";
import type { DeptHeadcounts } from "@/lib/admin";

function validateDeptHeadcounts(value: unknown): DeptHeadcounts | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const headcounts: DeptHeadcounts = {};
  for (const [rawDept, rawHeadcount] of Object.entries(value)) {
    const dept = rawDept.trim();
    if (!dept || typeof rawHeadcount !== "number" || !Number.isInteger(rawHeadcount) || rawHeadcount < 1) {
      return null;
    }
    headcounts[dept] = rawHeadcount;
  }
  return headcounts;
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const settings = await getSettingsAdmin();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const includesDeptHeadcounts = Object.prototype.hasOwnProperty.call(body, "deptHeadcounts");
  const deptHeadcounts = includesDeptHeadcounts ? validateDeptHeadcounts(body.deptHeadcounts) : null;

  if (includesDeptHeadcounts && deptHeadcounts === null) {
    return NextResponse.json({ error: "부서 인원수는 1명 이상의 정수로 입력해 주세요." }, { status: 400 });
  }

  if (Array.isArray(body.sensitiveKeywords)) {
    await updateSensitiveKeywords(body.sensitiveKeywords.map((k: unknown) => String(k)));
  }

  if (typeof body.registrationWarning === "string" || typeof body.globalDailyCallLimit === "number") {
    const current = await getSettingsAdmin();
    await saveSettingsAdmin({
      registrationWarning: typeof body.registrationWarning === "string" ? body.registrationWarning : current.registrationWarning,
      globalDailyCallLimit: typeof body.globalDailyCallLimit === "number" ? body.globalDailyCallLimit : current.globalDailyCallLimit,
    });
  }

  if (deptHeadcounts !== null) {
    await saveDeptHeadcounts(deptHeadcounts);
  }

  return NextResponse.json({ ok: true });
}
