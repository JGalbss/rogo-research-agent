import { tool } from "ai";
import { z } from "zod";
import { companies } from "../../data.ts";
import { simulateLatency } from "./utils/latency.ts";

export const searchCompanies = tool({
  description:
    "Search the coverage universe for companies matching a name. Returns the company name, ticker and sector for each match.",
  inputSchema: z.object({
    query: z.string().describe("A company name or part of one."),
  }),
  execute: async ({ query }) => {
    await simulateLatency(250);
    const needle = query.toLowerCase();
    return companies
      .filter((company) => company.name.toLowerCase().includes(needle))
      .map((company) => ({
        name: company.name,
        ticker: company.ticker,
        sector: company.sector,
      }));
  },
});
