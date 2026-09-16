import { getToolName, isToolUIPart } from "ai";
import { Array as Arr, HashMap, Match, Option, pipe, Schema, String as Str } from "effect";
import type { ResearchUIMessage } from "@/shared/chat";

export type TraceRow = {
  key: string;
  kind: "thought" | "action";
  primary: string;
  secondary?: string;
  streaming?: boolean;
};

const TOOL_LABELS = HashMap.make(
  ["searchCompanies", "Searched companies"],
  ["getCompanyProfile", "Read company profile"],
  ["getFinancials", "Pulled financials"],
  ["searchDocuments", "Searched documents"],
);

const Subject = Schema.Struct({
  company: Schema.optionalKey(Schema.String),
  query: Schema.optionalKey(Schema.String),
});

export const traceRows = (message: ResearchUIMessage): TraceRow[] =>
  Arr.flatMap(message.parts, (part, index) =>
    Match.value(part).pipe(
      Match.when({ type: "reasoning" }, ({ text }) =>
        pipe(
          text.split(/\n\s*\n/),
          Arr.map(Str.trim),
          Arr.filter(Str.isNonEmpty),
          Arr.map((primary, paragraph): TraceRow => ({
            key: `thought-${index}-${paragraph}`,
            kind: "thought",
            primary,
          })),
        ),
      ),
      Match.when(isToolUIPart, (tool): TraceRow[] => [
        {
          key: tool.toolCallId,
          kind: "action",
          primary: Option.getOrElse(HashMap.get(TOOL_LABELS, getToolName(tool)), () => getToolName(tool)),
          secondary: Match.value(tool).pipe(
            Match.when({ state: "output-error" }, ({ errorText }) => `failed: ${errorText ?? "unknown"}`),
            Match.orElse(({ input }) =>
              Schema.decodeUnknownOption(Subject)(input).pipe(
                Option.flatMap((fields) => Option.fromNullishOr(fields.company ?? fields.query)),
                Option.getOrElse(() => ""),
              ),
            ),
          ),
        },
      ]),
      Match.orElse(() => []),
    ),
  );

export const traceHeadline = (rows: ReadonlyArray<TraceRow>): string =>
  Option.match(Arr.last(rows), {
    onNone: () => "Thinking",
    onSome: (row) => (row.secondary ? `${row.primary} · ${row.secondary}` : row.primary),
  });

export const traceSubjects = (rows: ReadonlyArray<TraceRow>): string[] =>
  Arr.dedupe(rows.flatMap((row) => (row.kind === "action" && row.secondary ? [row.secondary] : [])));

export const traceSummary = (rows: ReadonlyArray<TraceRow>): string =>
  Match.value(rows.filter((row) => row.kind === "action").length).pipe(
    Match.when(0, () => "Thought it through"),
    Match.when(1, () => "Thought it through · 1 source"),
    Match.orElse((count) => `Thought it through · ${count} sources`),
  );
