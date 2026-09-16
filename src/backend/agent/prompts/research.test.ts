import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { describe, expect, it } from "vitest";
import { researchTools } from "../tools/index.ts";
import { promptCache, researchInstructions } from "./research.ts";

interface AnthropicRequestBody {
  readonly tools: ReadonlyArray<{ readonly name: string }>;
  readonly system: ReadonlyArray<{ readonly text: string; readonly cache_control?: { readonly type: string } }>;
  readonly cache_control?: { readonly type: string };
}

const reply = {
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-5",
  content: [{ type: "text", text: "ok" }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 1, output_tokens: 1 },
};

const requestSent = async (): Promise<AnthropicRequestBody> => {
  const sent: Array<AnthropicRequestBody> = [];
  const anthropic = createAnthropic({
    apiKey: "test",
    fetch: async (_url, init) => {
      const body: AnthropicRequestBody = JSON.parse(String(init?.body));
      sent.push(body);
      return new Response(JSON.stringify(reply), { headers: { "content-type": "application/json" } });
    },
  });
  await generateText({
    model: anthropic("claude-sonnet-5"),
    instructions: researchInstructions,
    tools: researchTools,
    prompt: "Compare Acme and Globex",
    providerOptions: promptCache,
  });
  expect(sent).toHaveLength(1);
  return sent[0];
};

describe("research prompt caching", () => {
  it("puts an explicit breakpoint on the system prompt, after the tools", async () => {
    const body = await requestSent();
    expect(body.tools.map((tool) => tool.name)).toEqual(Object.keys(researchTools));
    expect(body.system.at(-1)?.cache_control).toEqual({ type: "ephemeral" });
    expect(body.system.at(-1)?.text).toContain("Our coverage universe:");
  });

  it("asks for automatic caching of the growing conversation", async () => {
    const body = await requestSent();
    expect(body.cache_control).toEqual({ type: "ephemeral" });
  });
});
