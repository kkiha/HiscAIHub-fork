import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getPromptDTO, listPrompts } from "@/lib/prompts";
import { isWorkCategory } from "@/lib/work-categories";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const prompts = await listPrompts(user.id);
  return NextResponse.json({ prompts });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.desc ?? "").trim() || "(설명 없음)";
  const promptBody = String(body.body ?? "").trim();
  const category = String(body.cat ?? "").trim();

  if (!category) {
    return NextResponse.json({ error: "업무 카테고리를 선택해주세요." }, { status: 400 });
  }
  if (!isWorkCategory(category)) {
    return NextResponse.json({ error: "올바른 업무 카테고리를 선택해주세요." }, { status: 400 });
  }

  if (!title || !promptBody) {
    return NextResponse.json({ error: "제목과 프롬프트 내용을 입력해주세요." }, { status: 400 });
  }

  const created = await db.prompt.create({
    data: { title, description, body: promptBody, category, authorId: user.id },
  });
  const dto = await getPromptDTO(created.id, user.id);
  return NextResponse.json({ prompt: dto }, { status: 201 });
}
