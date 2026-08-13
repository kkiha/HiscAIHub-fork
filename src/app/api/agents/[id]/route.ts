import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getAgentDTO } from "@/lib/agents";
import { isWorkCategory } from "@/lib/work-categories";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await db.agent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.authorId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const description = String(body.desc ?? "").trim() || "(설명 없음)";
  const instructions = String(body.instructions ?? "").trim();
  const category = String(body.cat ?? "").trim() || existing.category;
  const tasks = Array.isArray(body.tasks)
    ? body.tasks.map((t: unknown) => String(t).trim()).filter(Boolean)
    : existing.exampleTasks;

  if (!isWorkCategory(category)) {
    return NextResponse.json({ error: "올바른 업무 카테고리를 선택해주세요." }, { status: 400 });
  }
  if (!name || !instructions) {
    return NextResponse.json({ error: "에이전트 이름과 지침을 입력해주세요." }, { status: 400 });
  }

  await db.agent.update({
    where: { id },
    data: { name, description, instructions, exampleTasks: tasks, category },
  });
  const dto = await getAgentDTO(id, user.id);
  return NextResponse.json({ agent: dto });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await db.agent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.authorId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await db.agent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
