import { createAnthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, stepCountIs } from "ai";
import { Redacted } from "effect";
import { config } from "../config.ts";
import { BaseAgent } from "./base-agent.ts";
import { promptCache, researchInstructions } from "./prompts/research.ts";
import { researchTools } from "./tools/index.ts";

const anthropic = createAnthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

export const researcher = new BaseAgent(
  new ToolLoopAgent({
    model: anthropic(config.model),
    instructions: researchInstructions,
    tools: researchTools,
    stopWhen: stepCountIs(config.maxSteps),
    maxOutputTokens: config.maxOutputTokens,
    providerOptions: promptCache,
  }),
);
