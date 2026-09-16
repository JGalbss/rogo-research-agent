import { tool } from "ai";
import { Array as Arr, Option } from "effect";
import { z } from "zod";
import { type ResearchDocument, documents } from "../../utils/data.ts";
import { requireCompany } from "./utils/companies.ts";
import { simulateLatency } from "./utils/latency.ts";
import { ToolError } from "./utils/tool-error.ts";

const UPSTREAM_INDEX_MAX_TERMS = 6;
const MAX_RESULTS = 5;
const EXCERPT_BEFORE = 120;
const EXCERPT_AFTER = 280;

export const excerpt = (document: ResearchDocument, terms: ReadonlyArray<string>): string => {
  const body = document.body;
  const lower = body.toLowerCase();
  const firstHit = Arr.head(
    terms
      .map((term) => lower.indexOf(term))
      .filter((index) => index >= 0)
      .toSorted((a, b) => a - b),
  );
  const start = Math.max(0, Option.getOrElse(firstHit, () => 0) - EXCERPT_BEFORE);
  const end = Math.min(body.length, Option.getOrElse(firstHit, () => 0) + EXCERPT_AFTER);
  const window = body.slice(start, end);
  if (start === 0 && end === body.length) return window;
  if (start === 0) return `${window}…`;
  if (end === body.length) return `…${window}`;
  return `…${window}…`;
};

export const searchDocuments = tool({
  description:
    "Keyword search over earnings call transcripts, filing excerpts and press releases. Returns up to 5 documents that contain at least one of the terms, best matches first, each with its id, company, form, title, date and a short excerpt around the match. Call getDocument with the id to read the full text before quoting it. The index accepts at most 6 terms per query and rejects longer queries.",
  inputSchema: z.object({
    query: z.string().describe("Up to 6 keywords separated by spaces."),
    company: z
      .string()
      .optional()
      .describe("Optional. A company name or ticker to restrict the search to."),
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

    const scope = Option.map(Option.fromNullishOr(company), (name) => requireCompany(name).name);
    const pool = documents.filter((document) =>
      Option.match(scope, {
        onNone: () => true,
        onSome: (name) => document.company === name,
      }),
    );
    const hits = pool.map((document) => {
      const haystack = `${document.title} ${document.body}`.toLowerCase();
      return { document, score: terms.filter((term) => haystack.includes(term)).length };
    });

    return hits
      .filter((hit) => hit.score > 0)
      .toSorted((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(({ document }) => ({
        id: document.id,
        company: document.company,
        form: document.form,
        title: document.title,
        date: document.date,
        excerpt: excerpt(document, terms),
      }));
  },
});
