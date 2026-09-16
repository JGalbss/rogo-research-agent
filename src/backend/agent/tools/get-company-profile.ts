import { tool } from "ai";
import { z } from "zod";
import { requireCompany } from "./utils/companies.ts";
import { simulateLatency } from "./utils/latency.ts";

export const getCompanyProfile = tool({
  description:
    "Get a company's profile: description, sector, headquarters, founding year, headcount, business segments with their share of revenue, and the filings we hold. Accepts an exact company name or ticker; the error lists the valid companies when the name does not resolve.",
  inputSchema: z.object({
    company: z.string().describe("Exact company name or ticker, for example 'Acme Corp' or 'ACME'."),
  }),
  execute: async ({ company }) => {
    await simulateLatency(450);
    return requireCompany(company);
  },
});
