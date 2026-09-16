import { tool } from "ai";
import { z } from "zod";
import { documents } from "../../data.ts";
import { simulateLatency } from "./utils/latency.ts";
import { ToolError } from "./utils/tool-error.ts";

const UPSTREAM_INDEX_MAX_TERMS = 6;
const MAX_RESULTS = 5;

export const searchDocuments = tool({
  description:
    "Keyword search over earnings call transcripts, filing excerpts and press releases.",
  inputSchema: z.object({
    query: z.string().describe("Keywords to search for."),
    company: z
      .string()
      .optional()
      .describe("Optional. Restrict the search to one company."),
  }),
  execute: async ({ query, company }) => {
    await simulateLatency(700);

    const terms = query
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => term.toLowerCase());
    if (terms.length > UPSTREAM_INDEX_MAX_TERMS) {
      throw new ToolError(
        `document search accepts at most ${UPSTREAM_INDEX_MAX_TERMS} terms (received ${terms.length})`,
      );
    }

    const pool = documents.filter(
      (document) => company === undefined || document.company === company,
    );
    const hits = pool.map((document) => {
      const haystack = `${document.title} ${document.body}`.toLowerCase();
      return {
        document,
        score: terms.filter((term) => haystack.includes(term)).length,
      };
    });

    return hits
      .filter((hit) => hit.score > 0)
      .toSorted((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((hit) => hit.document);
  },
});
