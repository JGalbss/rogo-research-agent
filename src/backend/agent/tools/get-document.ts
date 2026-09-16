import { tool } from "ai";
import { z } from "zod";
import { documents } from "../../utils/data.ts";
import { simulateLatency } from "./utils/latency.ts";
import { ToolError } from "./utils/tool-error.ts";

export const getDocument = tool({
  description:
    "Read one document in full by the id that searchDocuments returned, for example DOC-ACME-001. Use it before quoting a document or when the excerpt is not enough to answer.",
  inputSchema: z.object({
    id: z.string().describe("The document id from searchDocuments."),
  }),
  execute: async ({ id }) => {
    await simulateLatency(300);
    const documentId = id.trim().toUpperCase();
    const document = documents.find((candidate) => candidate.id === documentId);
    if (document === undefined) throw new ToolError(`no document with id "${id}"; use an id returned by searchDocuments`);
    return document;
  },
});
