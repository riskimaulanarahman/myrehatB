import { parseChatMessages, streamChatReply } from "@/lib/concierge/chat";
import { getConciergeConfig } from "@/lib/concierge/generate-reply";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const messages = await parseChatMessages(body);
  if (!messages) {
    return Response.json({ error: "Invalid chat messages" }, { status: 422 });
  }

  const config = getConciergeConfig();
  if (!config) {
    return Response.json({ error: "Chat is not configured" }, { status: 503 });
  }

  return streamChatReply(messages, config, request.signal);
}
