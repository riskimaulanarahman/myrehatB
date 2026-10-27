import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

import { CONCIERGE_SYSTEM_PROMPT } from "./prompt";

export const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.5-flash";

export type ConciergeConfig = {
  apiKey: string;
  model: string;
};

/** Reads OpenRouter settings from the environment; returns null when the API key is missing. */
export function getConciergeConfig(
  env: Record<string, string | undefined> = process.env,
): ConciergeConfig | null {
  const apiKey = env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return {
    apiKey,
    model: env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
  };
}

/** Generates a concierge reply for a single customer message via OpenRouter. */
export async function generateConciergeReply(
  message: string,
  config: ConciergeConfig,
): Promise<string> {
  const openrouter = createOpenRouter({ apiKey: config.apiKey });
  const { text } = await generateText({
    model: openrouter.chat(config.model),
    system: CONCIERGE_SYSTEM_PROMPT,
    prompt: message,
    maxOutputTokens: 400,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(25_000),
  });
  return text;
}
