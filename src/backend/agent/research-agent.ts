import { createAnthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, stepCountIs } from "ai";
import { Option, Redacted } from "effect";
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

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

export interface AgentResult {
  readonly answer: string;
  readonly iterations: number;
}

const researcher = new BaseAgent(
  new ToolLoopAgent({
    model: anthropic(config.model),
    instructions: INSTRUCTIONS,
    tools: researchTools,
    stopWhen: stepCountIs(config.maxSteps),
    maxOutputTokens: config.maxOutputTokens,
  }),
);

export const answerQuestion = async (
  question: string,
  onEvent: (event: AgentEvent) => void,
): Promise<AgentResult> => {
  const research = await researcher.ask(question, onEvent);

  return {
    answer: Option.getOrElse(research.answer, () => OUT_OF_STEPS_ANSWER),
    iterations: research.steps,
  };
};
