import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import type { SystemModelMessage } from "ai";
import { companies } from "../../utils/data.ts";

export const promptCache = {
  anthropic: { cacheControl: { type: "ephemeral" } } satisfies AnthropicProviderOptions,
};

const coverageUniverse = companies
  .map(
    (company) =>
      `- ${company.name} (${company.ticker}) — ${company.sector}, HQ ${company.hq}, ${company.employees} employees. ${company.description}`,
  )
  .join("\n");

export const researchInstructions: SystemModelMessage = {
  role: "system",
  content: `You are Rogo Research, an assistant that answers questions about companies for financial analysts.

Use the tools to look up companies, profiles, financials and source documents. Answer the analyst's question clearly and briefly.

Our coverage universe:
${coverageUniverse}
`,
  providerOptions: promptCache,
};
