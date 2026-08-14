// Claude API 클라이언트 싱글턴 — 서버(API Route)에서만 사용. 프런트에 키 노출 금지.
import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic | undefined };

export class AiGenerationDisabledError extends Error {
  constructor() {
    super("로컬 데모에서는 ANTHROPIC_API_KEY가 없어 AI 생성 기능을 사용할 수 없습니다.");
    this.name = "AiGenerationDisabledError";
  }
}

export function isAiGenerationEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getAnthropic(): Anthropic {
  if (!isAiGenerationEnabled()) throw new AiGenerationDisabledError();
  const client = globalForAnthropic.anthropic ?? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = client;
  return client;
}

export const GENERATE_MODEL = "claude-opus-4-8";

// Opus 4.8 가격 (2026-07 기준, USD / 1M tokens)
const INPUT_PRICE_PER_M = 5.0;
const OUTPUT_PRICE_PER_M = 25.0;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * INPUT_PRICE_PER_M + (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_M;
}

// Claude API 에러를 사용자에게 보여줄 한국어 메시지로 변환 (원본 API 응답은 서버 로그에만 남김).
export function friendlyClaudeError(e: unknown): string {
  console.error("[anthropic]", e);
  if (e instanceof AiGenerationDisabledError) return e.message;
  if (e instanceof Anthropic.APIError) {
    if (e.status === 400 && /credit balance/i.test(e.message)) {
      return "Anthropic API 크레딧이 부족해요. 관리자에게 문의해주세요.";
    }
    if (e.status === 401 || e.status === 403) {
      return "AI 생성 기능 인증에 실패했어요. 관리자에게 문의해주세요.";
    }
    if (e.status === 429) {
      return "지금 요청이 많아요. 잠시 후 다시 시도해주세요.";
    }
    if (e.status && e.status >= 500) {
      return "일시적인 오류예요. 잠시 후 다시 시도해주세요.";
    }
  }
  return e instanceof Error && !(e instanceof Anthropic.APIError) ? e.message : "생성 중 오류가 발생했어요.";
}
