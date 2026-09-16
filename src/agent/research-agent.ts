import { anthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, generateText, stepCountIs } from "ai";
import { Option } from "effect";
import { companies } from "../data.ts";
import { BaseAgent } from "./base-agent.ts";
import type { AgentEvent } from "./events.ts";
import { researchTools } from "./tools/index.ts";

const model = anthropic(process.env.ROGO_MODEL ?? "claude-sonnet-5");
const MAX_STEPS = 12;
const MAX_OUTPUT_TOKENS = 16000;

const coverageUniverse = companies
  .map(
    (company) =>
      `- ${company.name} (${company.ticker}) — ${company.sector}, HQ ${company.hq}, ${company.employees} employees. ${company.description}`,
  )
  .join("\n");

const INSTRUCTIONS = `You are Rogo Research, an assistant that answers questions about companies for financial analysts.

Use the tools to look up companies, profiles, financials and source documents. Answer the analyst's question.

Our coverage universe:
${coverageUniverse}
`;

const EDITOR_INSTRUCTIONS = `You are an editor. Rewrite the analyst's draft answer so that it reads clearly and is easy to follow. Keep it brief and conversational. Return only the rewritten answer.`;

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

export interface AgentResult {
  readonly answer: string;
  readonly iterations: number;
}

const researcher = new BaseAgent(
  new ToolLoopAgent({
    model,
    instructions: INSTRUCTIONS,
    tools: researchTools,
    stopWhen: stepCountIs(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  }),
);

export const answerQuestion = async (
  question: string,
  onEvent: (event: AgentEvent) => void,
): Promise<AgentResult> => {
  const research = await researcher.ask(question, onEvent);
  const draft = Option.getOrElse(research.draft, () => OUT_OF_STEPS_ANSWER);

  const edited = await generateText({
    model,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    system: EDITOR_INSTRUCTIONS,
    prompt: `Research transcript:\n${JSON.stringify(research.transcript)}\n\nDraft answer:\n${draft}\n\nRewrite the draft answer.`,
  });

  return { answer: edited.text, iterations: research.steps };
};
