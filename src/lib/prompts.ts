// 프롬프트 도메인 데이터 계층 — DB ↔ 프런트 DTO 변환.
import { db } from "./db";
import type { Prisma } from "@prisma/client";

export type CommentDTO = { id: string; name: string; dept: string; ava: string; date: string; text: string };

export type PromptDTO = {
  id: string;
  cat: string;
  date: string;
  title: string;
  desc: string;
  body: string;
  author: string;
  dept: string;
  ava: string;
  copies: number;
  runs: number;
  saved: boolean;
  mine: boolean;
  comments: CommentDTO[];
};

// 실제로 존재하지 않을 cuid — 비로그인/조회 전용 컨텍스트에서 saves를 빈 배열로 만들기 위한 sentinel.
const NONE = "__none__";

export function fmtDate(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function promptInclude(userId: string | null) {
  return {
    author: true,
    comments: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
    saves: { where: { userId: userId ?? NONE } },
  } satisfies Prisma.PromptInclude;
}

type LoadedPrompt = Prisma.PromptGetPayload<{ include: ReturnType<typeof promptInclude> }>;

function serializeComment(c: LoadedPrompt["comments"][number]): CommentDTO {
  return {
    id: c.id,
    name: c.user.name,
    dept: c.user.dept,
    ava: c.user.name.charAt(0),
    date: fmtDate(c.createdAt),
    text: c.text,
  };
}

function serializePrompt(p: LoadedPrompt, userId: string | null): PromptDTO {
  return {
    id: p.id,
    cat: p.category,
    date: fmtDate(p.createdAt),
    title: p.title,
    desc: p.description,
    body: p.body,
    author: p.author.name,
    dept: p.author.dept,
    ava: p.author.name.charAt(0),
    copies: p.copyCount,
    runs: p.runCount,
    saved: p.saves.length > 0,
    mine: userId != null && p.authorId === userId,
    comments: p.comments.map(serializeComment),
  };
}

export async function listPrompts(userId: string | null): Promise<PromptDTO[]> {
  const prompts = await db.prompt.findMany({
    where: { OR: [{ status: "published" }, ...(userId ? [{ authorId: userId }] : [])] },
    include: promptInclude(userId),
    orderBy: { createdAt: "desc" },
  });
  return prompts.map((p) => serializePrompt(p, userId));
}

export async function getPromptDTO(id: string, userId: string | null): Promise<PromptDTO | null> {
  const p = await db.prompt.findUnique({ where: { id }, include: promptInclude(userId) });
  if (!p) return null;
  return serializePrompt(p, userId);
}
