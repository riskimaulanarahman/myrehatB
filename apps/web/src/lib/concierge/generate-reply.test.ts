import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
  chat: vi.fn((modelId: string) => ({ modelId })),
  createOpenRouter: vi.fn(),
}));

vi.mock("ai", () => ({ generateText: mocks.generateText }));
vi.mock("@openrouter/ai-sdk-provider", () => ({ createOpenRouter: mocks.createOpenRouter }));

import { DEFAULT_OPENROUTER_MODEL, generateConciergeReply, getConciergeConfig } from "./generate-reply";
import { CONCIERGE_SYSTEM_PROMPT } from "./prompt";

describe("getConciergeConfig", () => {
  it("returns null when OPENROUTER_API_KEY is missing or blank", () => {
    expect(getConciergeConfig({})).toBeNull();
    expect(getConciergeConfig({ OPENROUTER_API_KEY: "  " })).toBeNull();
  });

  it("uses OPENROUTER_MODEL when set and the default otherwise", () => {
    expect(getConciergeConfig({ OPENROUTER_API_KEY: "test-key" })).toEqual({
      apiKey: "test-key",
      model: DEFAULT_OPENROUTER_MODEL,
    });
    expect(
      getConciergeConfig({ OPENROUTER_API_KEY: "test-key", OPENROUTER_MODEL: "openai/gpt-4o-mini" })
        ?.model,
    ).toBe("openai/gpt-4o-mini");
  });
});

describe("generateConciergeReply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createOpenRouter.mockReturnValue({ chat: mocks.chat });
  });

  it("calls generateText via OpenRouter with the concierge prompt (mocked, no network)", async () => {
    mocks.generateText.mockResolvedValue({ text: "Mocked concierge reply" });

    const reply = await generateConciergeReply("Hello", { apiKey: "test-key", model: "test/model" });

    expect(reply).toBe("Mocked concierge reply");
    expect(mocks.createOpenRouter).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(mocks.chat).toHaveBeenCalledWith("test/model");
    expect(mocks.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { modelId: "test/model" },
        system: CONCIERGE_SYSTEM_PROMPT,
        prompt: "Hello",
      }),
    );
  });
});
