import { describe, expect, it, vi } from "vitest";

import { formatWahaReply, handleWahaWebhook, wahaMessageSchema } from "./waha-webhook";

const validPayload = {
  event: "message",
  payload: { from: "628123456789@c.us", body: "I need a homestay in Bali" },
};

describe("WAHA payload validation", () => {
  it.each([
    ["@c.us sender", validPayload],
    ["plain number sender", { event: "message", payload: { from: "628123456789", body: "Hi" } }],
  ])("accepts a valid payload (%s)", (_label, body) => {
    expect(wahaMessageSchema.safeParse(body).success).toBe(true);
  });

  it.each([
    ["missing payload", { event: "message" }],
    ["missing from", { event: "message", payload: { body: "Hi" } }],
    ["blank from", { event: "message", payload: { from: "  ", body: "Hi" } }],
    ["empty body", { event: "message", payload: { from: "628123456789", body: "" } }],
    ["wrong event", { event: "message.ack", payload: { from: "628123456789", body: "Hi" } }],
    ["numeric from", { event: "message", payload: { from: 628123456789, body: "Hi" } }],
    ["non-string body", { event: "message", payload: { from: "628123456789", body: ["Hi"] } }],
    ["array", [1, 2]],
    ["null", null],
  ])("rejects %s", (_label, body) => {
    expect(wahaMessageSchema.safeParse(body).success).toBe(false);
  });
});

describe("reply formatting", () => {
  it("maps payload.from to `to` and the AI text to `reply`, with no other keys", () => {
    const message = wahaMessageSchema.parse(validPayload);
    const formatted = formatWahaReply(message, "  Hello from the concierge  ");
    expect(formatted).toStrictEqual({ to: "628123456789@c.us", reply: "Hello from the concierge" });
  });
});

describe("handleWahaWebhook", () => {
  it("returns { to, reply } using the mocked AI generator", async () => {
    const generateReply = vi.fn().mockResolvedValue("Here are some tips for Bali homestays.");

    const result = await handleWahaWebhook(validPayload, generateReply);

    expect(generateReply).toHaveBeenCalledWith("I need a homestay in Bali");
    expect(result).toStrictEqual({
      status: 200,
      body: { to: "628123456789@c.us", reply: "Here are some tips for Bali homestays." },
    });
  });

  it("returns 422 and does not call the AI for an invalid payload", async () => {
    const generateReply = vi.fn();
    const result = await handleWahaWebhook({ event: "message", payload: {} }, generateReply);
    expect(result.status).toBe(422);
    expect(generateReply).not.toHaveBeenCalled();
  });

  it("returns 503 when the concierge is not configured", async () => {
    const result = await handleWahaWebhook(validPayload, null);
    expect(result).toStrictEqual({ status: 503, body: { error: "Concierge is not configured" } });
  });

  it("returns a generic 502 when the AI call fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const generateReply = vi.fn().mockRejectedValue(new Error("upstream secret detail"));

    const result = await handleWahaWebhook(validPayload, generateReply);

    expect(result).toStrictEqual({ status: 502, body: { error: "Failed to generate reply" } });
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("returns 502 when the AI returns an empty reply", async () => {
    const result = await handleWahaWebhook(validPayload, vi.fn().mockResolvedValue("   "));
    expect(result.status).toBe(502);
  });
});
