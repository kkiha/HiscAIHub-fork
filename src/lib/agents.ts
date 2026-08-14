// 에이전트 도메인 데이터 계층 — DB ↔ 프런트 DTO 변환.
import { db } from "./db";
import type { Prisma } from "@prisma/client";
import { fmtDate } from "./prompts";
import type { CommentDTO } from "./prompts";
import { parseAgentExampleTasks } from "./agent-example-tasks";

export type AgentDTO = {
  id: string;
  cat: string;
  date: string;
  name: string;
  desc: string;
  instructions: string;
  tasks: string[];
  author: string;
  dept: string;
  ava: string;
  runs: number;
  saved: boolean;
  mine: boolean;
  comments: CommentDTO[];
};

const NONE = "__none__";

function agentInclude(userId: string | null) {
  return {
    author: true,
    comments: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
    saves: { where: { userId: userId ?? NONE } },
  } satisfies Prisma.AgentInclude;
}

type LoadedAgent = Prisma.AgentGetPayload<{ include: ReturnType<typeof agentInclude> }>;

function serializeComment(c: LoadedAgent["comments"][number]): CommentDTO {
  return {
    id: c.id,
    name: c.user.name,
    dept: c.user.dept,
    ava: c.user.name.charAt(0),
    date: fmtDate(c.createdAt),
    text: c.text,
  };
}

function serializeAgent(a: LoadedAgent, userId: string | null): AgentDTO {
  return {
    id: a.id,
    cat: a.category,
    date: fmtDate(a.createdAt),
    name: a.name,
    desc: a.description,
    instructions: a.instructions,
    tasks: parseAgentExampleTasks(a.exampleTasks),
    author: a.author.name,
    dept: a.author.dept,
    ava: a.author.name.charAt(0),
    runs: a.runCount,
    saved: a.saves.length > 0,
    mine: userId != null && a.authorId === userId,
    comments: a.comments.map(serializeComment),
  };
}

export async function listAgents(userId: string | null): Promise<AgentDTO[]> {
  const agents = await db.agent.findMany({
    where: { OR: [{ status: "published" }, ...(userId ? [{ authorId: userId }] : [])] },
    include: agentInclude(userId),
    orderBy: { createdAt: "desc" },
  });
  return agents.map((a) => serializeAgent(a, userId));
}

export async function getAgentDTO(id: string, userId: string | null): Promise<AgentDTO | null> {
  const a = await db.agent.findUnique({ where: { id }, include: agentInclude(userId) });
  if (!a) return null;
  return serializeAgent(a, userId);
}
