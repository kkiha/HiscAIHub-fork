// 프롬프트/에이전트 "만들기" — 데모의 규칙기반(roleFor/buildPrompt/buildAgent)을
// 백엔드 Claude 메타프롬프트 호출로 교체. 구조화된 출력(zod)으로 안정적으로 파싱.
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, GENERATE_MODEL, estimateCostUsd } from "./anthropic";
import { db } from "./db";
import type { WorkCategory } from "./work-categories";

const ROLE_HINTS: Record<WorkCategory, string> = {
  "작성·요약": "당신은 금융투자업 문서 작성과 핵심 요약을 돕는 전문 비서입니다.",
  "조사·리서치": "당신은 증권사 리서치센터의 숙련된 애널리스트입니다.",
  "분석": "당신은 금융 데이터와 업무 정보를 구조적으로 분석하는 전문가입니다.",
  "번역·검토": "당신은 금융 분야에 정통한 전문 번역가이자 검토자입니다.",
  "기획·아이디어": "당신은 금융사 전략기획 실무에 능한 기획 전문가입니다.",
  "자동화·개발": "당신은 금융 시스템 개발과 업무 자동화에 능숙한 시니어 엔지니어입니다.",
};

function roleFor(cat: WorkCategory): string {
  return ROLE_HINTS[cat];
}

const PromptGenSchema = z.object({
  title: z.string().describe("생성된 프롬프트를 한눈에 알아볼 수 있는 22자 이내의 간결한 한국어 제목"),
  body: z
    .string()
    .describe(
      "역할 문장 하나, 그 다음 '# 목표', '# 입력 정보', '# 작업 지침', '# 출력 형식', '# 작성 규칙' 마크다운 헤더 구조를 그대로 따르는 프롬프트 전문. " +
        "'# 입력 정보' 섹션은 반드시 '{{여기에 실제 내용을 붙여넣으세요}}' 형태의 이중 중괄호 placeholder를 포함해야 함.",
    ),
});

const AgentGenSchema = z.object({
  name: z.string().describe("에이전트 이름 (예: 리서치 어시스턴트, 6자 내외의 간결한 한국어)"),
  instructions: z
    .string()
    .describe("역할 문장, 이 에이전트가 수행할 업무 설명, '규칙:' 이후 불릿 3개 내외로 구성된 에이전트 시스템 지침 전문."),
  tasks: z
    .array(z.string())
    .describe("이 에이전트에게 시킬 수 있는 예시 작업 정확히 3개. 각각 사용자 명령형 한 줄 (예: '이 리포트 핵심만 요약해줘')."),
});

const COMPLIANCE_RULE =
  "업무 내용이 고객·투자·상품·수익·매수·매도·종목·추천·펀드 등과 관련 있다면, 단정적인 수익 보장이나 투자 권유로 해석될 수 있는 표현은 피하고 사실 중심으로 작성하도록 지침에 반드시 포함하세요.";
const SENSITIVE_RULE = "실제 고객정보·계좌번호·주민번호 등 민감정보를 예시에 포함하지 마세요.";

async function logUsage(
  userId: string,
  feature: "prompt_generate" | "agent_generate",
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  await db.usageLog.create({
    data: {
      userId,
      feature,
      tokensIn: inputTokens,
      tokensOut: outputTokens,
      costUsd: estimateCostUsd(inputTokens, outputTokens),
    },
  });
}

export async function generatePrompt(userId: string, cat: WorkCategory, task: string) {
  const system = `당신은 한화투자증권 사내 "AI 공유 허브"의 프롬프트 생성기입니다.
임직원이 설명한 업무를 바탕으로, Claude에게 바로 시킬 수 있는 완성도 높은 한국어 프롬프트를 만들어주세요.

카테고리: ${cat}
이 카테고리의 전형적인 역할: ${roleFor(cat)}

작성 규칙:
- body의 첫 줄은 위 역할을 참고한 전문가 역할 한 문장으로 시작합니다.
- 이어서 '# 목표', '# 입력 정보', '# 작업 지침', '# 출력 형식', '# 작성 규칙' 순서의 마크다운 헤더 구조를 그대로 사용합니다.
- ${COMPLIANCE_RULE}
- ${SENSITIVE_RULE}`;

  const response = await getAnthropic().messages.parse({
    model: GENERATE_MODEL,
    max_tokens: 2048,
    system,
    output_config: { format: zodOutputFormat(PromptGenSchema), effort: "medium" },
    messages: [{ role: "user", content: `업무 설명: ${task}` }],
  });

  await logUsage(userId, "prompt_generate", response.usage.input_tokens, response.usage.output_tokens);

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("프롬프트 생성에 실패했어요. 다른 표현으로 다시 시도해주세요.");
  }
  return response.parsed_output;
}

export async function generateAgent(userId: string, cat: WorkCategory, task: string) {
  const system = `당신은 한화투자증권 사내 "AI 공유 허브"의 에이전트 생성기입니다.
임직원이 맡기고 싶은 업무를 바탕으로, 반복 실행 가능한 에이전트(이름/시스템 지침/예시 작업)를 설계해주세요.

카테고리: ${cat}
이 카테고리의 전형적인 역할: ${roleFor(cat)}

작성 규칙:
- instructions의 첫 줄은 위 역할을 참고한 전문가 역할 한 문장으로 시작합니다.
- 그 다음 이 에이전트가 사용자 대신 수행할 업무를 설명하고, '규칙:' 이후 불릿으로 행동 원칙을 정리합니다.
- ${COMPLIANCE_RULE}
- ${SENSITIVE_RULE}
- tasks는 정확히 3개, 사용자가 그대로 입력할 법한 짧은 명령형 문장으로 작성합니다.`;

  const response = await getAnthropic().messages.parse({
    model: GENERATE_MODEL,
    max_tokens: 2048,
    system,
    output_config: { format: zodOutputFormat(AgentGenSchema), effort: "medium" },
    messages: [{ role: "user", content: `맡기고 싶은 업무: ${task}` }],
  });

  await logUsage(userId, "agent_generate", response.usage.input_tokens, response.usage.output_tokens);

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("에이전트 생성에 실패했어요. 다른 표현으로 다시 시도해주세요.");
  }
  const tasks = response.parsed_output.tasks.filter(Boolean).slice(0, 3);
  return { ...response.parsed_output, tasks: tasks.length ? tasks : [task.slice(0, 20)] };
}
