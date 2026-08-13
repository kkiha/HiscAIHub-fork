import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getPromptDTO } from "@/lib/prompts";
import { isWorkCategory } from "@/lib/work-categories";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await db.prompt.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.authorId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.desc ?? "").trim() || "(설명 없음)";
  const promptBody = String(body.body ?? "").trim();
  const category = String(body.cat ?? "").trim() || existing.category;

  if (!isWorkCategory(category)) {
    return NextResponse.json({ error: "올바른 업무 카테고리를 선택해주세요." }, { status: 400 });
  }
  if (!title || !promptBody) {
    return NextResponse.json({ error: "제목과 프롬프트 내용을 입력해주세요." }, { status: 400 });
  }

  await db.prompt.update({ where: { id }, data: { title, description, body: promptBody, category } });
  const dto = await getPromptDTO(id, user.id);
  return NextResponse.json({ prompt: dto });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await db.prompt.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.authorId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await db.prompt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
