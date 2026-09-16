import { tool } from "ai";
import { z } from "zod";
import { financials } from "../../utils/data.ts";
import { requireCompany } from "./utils/companies.ts";
import { simulateLatency } from "./utils/latency.ts";
import { ToolError } from "./utils/tool-error.ts";

const RECENT_QUARTERS = 4;

export const getFinancials = tool({
  description:
    "Get a company's financials in USD millions: every fiscal year on record (revenue, gross margin, operating income, net income, free cash flow) and the last four quarters (revenue, gross margin, operating income). Includes restatements and data warnings; a null figure means the value is not available and the warnings say why. Accepts an exact company name or ticker.",
  inputSchema: z.object({
    company: z.string().describe("Exact company name or ticker, for example 'Acme Corp' or 'ACME'."),
  }),
  execute: async ({ company }) => {
    await simulateLatency(800);
    const resolved = requireCompany(company);
    const record = financials.find((candidate) => candidate.ticker === resolved.ticker);
    if (record === undefined) throw new ToolError(`no financials on record for ${resolved.name}`);
    return {
      company: record.company,
      ticker: record.ticker,
      currency: record.currency,
      unit: record.unit,
      annual: record.annual,
      recentQuarters: record.quarterly.slice(-RECENT_QUARTERS),
      restatements: record.provenance.restatements,
      warnings: record.warnings ?? [],
      source: record.provenance.source,
    };
  },
});
