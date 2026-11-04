import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import type { ConciergeConfig } from "./generate-reply";
import { createSearchListingsTool } from "./listing-search";
import { CHAT_SYSTEM_PROMPT } from "./prompt";

// The chat is public and spends the OpenRouter key, so keep each request small.
export const MAX_CHAT_MESSAGES = 40;
export const MAX_CHAT_CHARACTERS = 20_000;
const MAX_REQUEST_CHARACTERS = 200_000;

/** Returns the validated messages of a chat request, or null when the request must be rejected. */
export async function parseChatMessages(body: unknown): Promise<UIMessage[] | null> {
  const messages = (body as { messages?: unknown } | null)?.messages;
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_CHAT_MESSAGES ||
    JSON.stringify(messages).length > MAX_REQUEST_CHARACTERS
  ) {
    return null;
  }

  const result = await safeValidateUIMessages({ messages });
  if (!result.success) {
    return null;
  }
  // A client-supplied system message could override the system prompt.
  if (result.data.some((message) => message.role === "system")) {
    return null;
  }

  // Keep only text: tool results sent back by the browser could be forged, and the model can search again.
  const textMessages = result.data
    .map((message) => ({
      ...message,
      parts: message.parts.filter((part) => part.type === "text"),
    }))
    .filter((message) => message.parts.length > 0);

  return textMessages.length > 0 && JSON.stringify(textMessages).length <= MAX_CHAT_CHARACTERS
    ? textMessages
    : null;
}

/** Streams an assistant reply for the conversation via OpenRouter. */
export async function streamChatReply(
  messages: UIMessage[],
  config: ConciergeConfig,
  signal: AbortSignal,
): Promise<Response> {
  const openrouter = createOpenRouter({ apiKey: config.apiKey });
  const result = streamText({
    model: openrouter.chat(config.model),
    system: CHAT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { searchListings: createSearchListingsTool() },
    // One search, an optional refined search, then the answer.
    stopWhen: isStepCount(3),
    maxOutputTokens: 800,
    maxRetries: 1,
    abortSignal: AbortSignal.any([signal, AbortSignal.timeout(60_000)]),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
