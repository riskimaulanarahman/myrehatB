import { generateConciergeReply, getConciergeConfig } from "@/lib/concierge/generate-reply";
import { handleWahaWebhook } from "@/lib/concierge/waha-webhook";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const config = getConciergeConfig();
  const result = await handleWahaWebhook(
    body,
    config ? (message) => generateConciergeReply(message, config) : null,
  );

  return Response.json(result.body, { status: result.status });
}
