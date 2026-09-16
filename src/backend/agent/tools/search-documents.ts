import { tool } from "ai";
import { z } from "zod";
import { documents } from "../../utils/data.ts";
import { simulateLatency } from "./utils/latency.ts";
import { ToolError } from "./utils/tool-error.ts";

const UPSTREAM_INDEX_MAX_TERMS = 6;
const MAX_RESULTS = 5;

export const searchDocuments = tool({
  description:
    "Keyword search over earnings call transcripts, filing excerpts and press releases. Returns up to 5 documents that contain at least one of the terms, best matches first, each with its id, company, form, title, date and full body text. The index accepts at most 6 terms per query and rejects longer queries.",
  inputSchema: z.object({
    query: z.string().describe("Up to 6 keywords separated by spaces."),
    company: z
      .string()
      .optional()
      .describe("Optional. The exact company name from the coverage universe to restrict the search to."),
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
