import { tool } from "ai";
import { z } from "zod";
import { financials } from "../../utils/data.ts";
import { simulateLatency } from "./utils/latency.ts";
import { ToolError } from "./utils/tool-error.ts";

export const getFinancials = tool({
  description:
    "Get annual and quarterly financials for a company: revenue, gross margin, operating income, net income and free cash flow, in USD millions. Includes provenance, any restatements and any data warnings; a null figure means the value is not available.",
  inputSchema: z.object({
    company: z.string().describe("The exact company name as listed in the coverage universe, for example 'Acme Corp'."),
  }),
  execute: async ({ company }) => {
    await simulateLatency(800);
    const record = financials.find(
      (candidate) => candidate.company === company,
    );
    if (record === undefined)
      throw new ToolError(`no financials found for "${company}"`);
    return record;
  },
});
