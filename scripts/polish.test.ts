import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";

import {
  buildPolishPrompt,
  createModelGenerator,
  POLISH_SYSTEM_PROMPT,
  polishListingDescription,
} from "./polish";

const raw = "3 room house near beach good for homestay owner selling fast";

describe("polishListingDescription", () => {
  it("sends the system prompt and raw text to the mocked generator and returns its text", async () => {
    const generate = vi.fn().mockResolvedValue("  A three-room beachside house, ideal for a homestay.  ");

    const polished = await polishListingDescription(`  ${raw}  `, generate);

    expect(polished).toBe("A three-room beachside house, ideal for a homestay.");
    expect(generate).toHaveBeenCalledWith({
      system: POLISH_SYSTEM_PROMPT,
      prompt: buildPolishPrompt(raw),
    });
  });

  it("rejects empty input without calling the AI", async () => {
    const generate = vi.fn();
    await expect(polishListingDescription("   ", generate)).rejects.toThrow("must not be empty");
    expect(generate).not.toHaveBeenCalled();
  });

  it("rejects an empty model response", async () => {
    await expect(polishListingDescription(raw, vi.fn().mockResolvedValue(" "))).rejects.toThrow(
      "empty description",
    );
  });
});

describe("createModelGenerator", () => {
  it("runs generateText against a mocked language model (no provider or network)", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: {
        content: [{ type: "text", text: "Polished by the mock model." }],
        finishReason: { unified: "stop", raw: "stop" },
        usage: {
          inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
          outputTokens: { total: 5, text: 5, reasoning: 0 },
        },
        warnings: [],
      },
    });

    const polished = await polishListingDescription(raw, createModelGenerator(model));

    expect(polished).toBe("Polished by the mock model.");
    expect(model.doGenerateCalls).toHaveLength(1);
    expect(JSON.stringify(model.doGenerateCalls[0]?.prompt)).toContain(raw);
  });
});
