import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { generateAgent } from "@/lib/generate";
import { friendlyClaudeError, isAiGenerationEnabled } from "@/lib/anthropic";
import { isWorkCategory } from "@/lib/work-categories";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const cat = String(body.cat ?? "").trim();
  const task = String(body.task ?? "").trim();
  if (!cat) return NextResponse.json({ error: "업무 카테고리를 선택해주세요." }, { status: 400 });
  if (!isWorkCategory(cat)) return NextResponse.json({ error: "올바른 업무 카테고리를 선택해주세요." }, { status: 400 });
  if (!task) return NextResponse.json({ error: "어떤 일을 하는 에이전트인지 입력해주세요." }, { status: 400 });
  if (!isAiGenerationEnabled()) {
    return NextResponse.json({ error: "로컬 데모에서는 AI 생성 기능이 비활성화되어 있습니다." }, { status: 503 });
  }

  try {
    const result = await generateAgent(user.id, cat, task);
    return NextResponse.json({ ...result, category: cat });
  } catch (e) {
    return NextResponse.json({ error: friendlyClaudeError(e) }, { status: 502 });
  }
}
