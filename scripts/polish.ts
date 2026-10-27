/**
 * F3: polishes a raw BuyHomestay listing description with an AI model served by OpenCode
 * (via ai-sdk-provider-opencode-sdk).
 *
 * Usage:
 *   bun scripts/polish.ts "3 room house near beach, good for homestay, owner selling fast"
 *   echo "raw text" | bun scripts/polish.ts
 *
 * Environment:
 *   OPENCODE_BASE_URL  OpenCode 2.x server URL (default http://127.0.0.1:4096)
 *   OPENCODE_PASSWORD  password the server was started with (Basic auth user "opencode")
 *   OPENCODE_MODEL     providerID/modelID from the server catalog (default opencode/big-pickle)
 */
import { generateText, type LanguageModel } from "ai";
import { createOpencode, OpencodeModels } from "ai-sdk-provider-opencode-sdk";

export const POLISH_SYSTEM_PROMPT = `You polish property listing descriptions for MyRehat BuyHomestay.

Rewrite the seller's text into a clear, appealing listing description:
- Keep every fact from the original (size, rooms, location, price, condition) and never invent new ones.
- Fix grammar and spelling, and keep the original language.
- Use 2-4 short sentences of plain text, with no markdown, emojis or headings.
- Return only the polished description.`;

/** Turns a system prompt and user prompt into model text. Injected so tests can mock the AI call. */
export type PolishGenerator = (request: { system: string; prompt: string }) => Promise<string>;

export function buildPolishPrompt(description: string): string {
  return `Polish this listing description:\n\n${description}`;
}

export async function polishListingDescription(
  description: string,
  generate: PolishGenerator,
): Promise<string> {
  const original = description.trim();
  if (!original) {
    throw new Error("Listing description must not be empty");
  }

  const polished = (
    await generate({ system: POLISH_SYSTEM_PROMPT, prompt: buildPolishPrompt(original) })
  ).trim();
  if (!polished) {
    throw new Error("The model returned an empty description");
  }
  return polished;
}

/** Adapts any AI SDK language model into a PolishGenerator using generateText. */
export function createModelGenerator(model: LanguageModel): PolishGenerator {
  return async ({ system, prompt }) => {
    const { text } = await generateText({ model, system, prompt });
    return text;
  };
}

async function readInput(args: string[]): Promise<string> {
  if (args.length > 0) {
    return args.join(" ");
  }
  if (process.stdin.isTTY) {
    return "";
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const description = await readInput(process.argv.slice(2));
  if (!description.trim()) {
    console.error('Usage: bun scripts/polish.ts "<listing description>"');
    process.exit(1);
  }

  const password = process.env.OPENCODE_PASSWORD ?? "";
  const opencode = createOpencode({
    baseUrl: process.env.OPENCODE_BASE_URL ?? "http://127.0.0.1:4096",
    clientOptions: {
      headers: {
        Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`,
      },
    },
  });

  try {
    const model = opencode(process.env.OPENCODE_MODEL ?? OpencodeModels["big-pickle"]);
    console.log(await polishListingDescription(description, createModelGenerator(model)));
  } finally {
    await opencode.dispose();
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Failed to polish description");
    process.exit(1);
  });
}
