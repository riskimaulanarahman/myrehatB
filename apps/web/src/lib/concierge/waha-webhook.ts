import { z } from "zod";

const nonBlank = (field: string) =>
  z.string().refine((value) => value.trim().length > 0, `${field} must not be empty`);

export const wahaMessageSchema = z.object({
  event: z.literal("message"),
  payload: z.object({
    from: nonBlank("payload.from"),
    body: nonBlank("payload.body"),
  }),
});

export type WahaMessage = z.infer<typeof wahaMessageSchema>;

export type WahaReply = {
  to: string;
  reply: string;
};

export type WebhookError = {
  error: string;
};

export type WebhookResult =
  | { status: 200; body: WahaReply }
  | { status: 422 | 502 | 503; body: WebhookError };

/** Produces a reply for one customer message. Injected so tests can mock the AI call. */
export type ReplyGenerator = (message: string) => Promise<string>;

export function formatWahaReply(message: WahaMessage, reply: string): WahaReply {
  return { to: message.payload.from, reply: reply.trim() };
}

/**
 * Validates a WAHA payload and builds the webhook response.
 * Pass `null` as the generator when the AI provider is not configured.
 */
export async function handleWahaWebhook(
  body: unknown,
  generateReply: ReplyGenerator | null,
): Promise<WebhookResult> {
  const parsed = wahaMessageSchema.safeParse(body);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "body"))];
    return { status: 422, body: { error: `Invalid WAHA payload: ${fields.join(", ")}` } };
  }

  if (!generateReply) {
    return { status: 503, body: { error: "Concierge is not configured" } };
  }

  let reply: string;
  try {
    reply = await generateReply(parsed.data.payload.body.trim());
  } catch (error) {
    // Log only the error type/message; never the request config or credentials.
    console.error(
      "[waha-webhook] reply generation failed:",
      error instanceof Error ? `${error.name}: ${error.message}` : "unknown error",
    );
    return { status: 502, body: { error: "Failed to generate reply" } };
  }

  if (!reply.trim()) {
    return { status: 502, body: { error: "Failed to generate reply" } };
  }

  return { status: 200, body: formatWahaReply(parsed.data, reply) };
}
