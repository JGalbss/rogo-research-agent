import { tool } from "ai";
import { z } from "zod";
import { companies } from "../../utils/data.ts";
import { simulateLatency } from "./utils/latency.ts";
import { ToolError } from "./utils/tool-error.ts";

export const getCompanyProfile = tool({
  description:
    "Get a company's profile: description, sector, headquarters, headcount, business segments and the filings we hold.",
  inputSchema: z.object({
    company: z.string().describe("The company name."),
  }),
  execute: async ({ company }) => {
    await simulateLatency(450);
    const profile = companies.find((candidate) => candidate.name === company);
    if (profile === undefined)
      throw new ToolError(`no profile found for "${company}"`);
    return profile;
  },
});
