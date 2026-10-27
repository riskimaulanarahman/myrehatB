import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConciergeConfig: vi.fn(),
  generateConciergeReply: vi.fn(),
}));

vi.mock("@/lib/concierge/generate-reply", () => mocks);

import { POST } from "./route";

const post = (body: string) =>
  POST(
    new Request("http://localhost/api/webhooks/waha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );

const validBody = JSON.stringify({
  event: "message",
  payload: { from: "628123456789", body: "I am looking for a homestay" },
});

describe("POST /api/webhooks/waha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConciergeConfig.mockReturnValue({ apiKey: "test-key", model: "test/model" });
  });

  it("responds 200 with exactly { to, reply }", async () => {
    mocks.generateConciergeReply.mockResolvedValue("Happy to help you find a homestay!");

    const response = await post(validBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      to: "628123456789",
      reply: "Happy to help you find a homestay!",
    });
  });

  it("responds 400 for invalid JSON", async () => {
    const response = await post("{not json");
    expect(response.status).toBe(400);
  });

  it("responds 422 for a malformed payload", async () => {
    const response = await post(JSON.stringify({ event: "message", payload: { from: "1" } }));
    expect(response.status).toBe(422);
    expect(mocks.generateConciergeReply).not.toHaveBeenCalled();
  });

  it("responds 503 without calling the provider when no key is configured", async () => {
    mocks.getConciergeConfig.mockReturnValue(null);

    const response = await post(validBody);

    expect(response.status).toBe(503);
    expect(await response.json()).toStrictEqual({ error: "Concierge is not configured" });
    expect(mocks.generateConciergeReply).not.toHaveBeenCalled();
  });
});
