import { createAnthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, stepCountIs, type ModelMessage } from "ai";
import { Redacted } from "effect";
import { config } from "../config.ts";
import { companies } from "../utils/data.ts";
import { BaseAgent } from "./base-agent.ts";
import type { AgentEvent } from "./events.ts";
import { researchTools } from "./tools/index.ts";

const anthropic = createAnthropic({ apiKey: Redacted.value(config.anthropicApiKey) });

const coverageUniverse = companies
  .map(
    (company) =>
      `- ${company.name} (${company.ticker}) — ${company.sector}, HQ ${company.hq}, ${company.employees} employees. ${company.description}`,
  )
  .join("\n");

const INSTRUCTIONS = `You are Rogo Research, an assistant that answers questions about companies for financial analysts.

Use the tools to look up companies, profiles, financials and source documents. Answer the analyst's question clearly and briefly.

Our coverage universe:
${coverageUniverse}
`;

const researcher = new BaseAgent(
  new ToolLoopAgent({
    model: anthropic(config.model),
    instructions: INSTRUCTIONS,
    tools: researchTools,
    stopWhen: stepCountIs(config.maxSteps),
    maxOutputTokens: config.maxOutputTokens,
  }),
);

export const streamAnswer = (
  messages: ModelMessage[],
  onEvent: (event: AgentEvent) => void,
): ReturnType<typeof researcher.stream> => researcher.stream(messages, onEvent);
