import { tool } from "ai";
import { z } from "zod";
import { findCompanies } from "./utils/companies.ts";
import { simulateLatency } from "./utils/latency.ts";

export const searchCompanies = tool({
  description:
    "Find companies in the coverage universe by name, partial name or ticker; punctuation and legal suffixes are ignored. Returns name, ticker and sector for each match. Call this first when the analyst did not give an exact name or ticker. When it returns more than one company, do not pick one silently: ask the analyst which they mean, or answer for each and say so.",
  inputSchema: z.object({
    query: z.string().describe("A company name, part of a name, or a ticker."),
  }),
  execute: async ({ query }) => {
    await simulateLatency(250);
    return findCompanies(query).map((company) => ({
      name: company.name,
      ticker: company.ticker,
      sector: company.sector,
    }));
  },
});
