import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConciergeConfig: vi.fn(),
  streamChatReply: vi.fn(),
}));

vi.mock("@/lib/concierge/generate-reply", () => ({ getConciergeConfig: mocks.getConciergeConfig }));
vi.mock("@/lib/concierge/chat", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/concierge/chat")>()),
  streamChatReply: mocks.streamChatReply,
}));

import { POST } from "./route";

const post = (body: string) =>
  POST(
    new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );

const validBody = JSON.stringify({
  messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "Hello" }] }],
});

describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConciergeConfig.mockReturnValue({ apiKey: "test-key", model: "test/model" });
    mocks.streamChatReply.mockResolvedValue(new Response("stream"));
  });

  it("streams the reply for valid messages", async () => {
    const response = await post(validBody);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("stream");
    expect(mocks.streamChatReply).toHaveBeenCalledOnce();
  });

  it("responds 400 for invalid JSON", async () => {
    const response = await post("{not json");
    expect(response.status).toBe(400);
  });

  it("responds 422 for invalid messages without calling the provider", async () => {
    const response = await post(JSON.stringify({ messages: [] }));
    expect(response.status).toBe(422);
    expect(mocks.streamChatReply).not.toHaveBeenCalled();
  });

  it("responds 503 without calling the provider when no key is configured", async () => {
    mocks.getConciergeConfig.mockReturnValue(null);

    const response = await post(validBody);

    expect(response.status).toBe(503);
    expect(await response.json()).toStrictEqual({ error: "Chat is not configured" });
    expect(mocks.streamChatReply).not.toHaveBeenCalled();
  });
});
