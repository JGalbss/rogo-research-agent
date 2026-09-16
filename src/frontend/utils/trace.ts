import { getToolName, isToolUIPart } from "ai";
import type { ToolUIPart } from "ai";
import { Array as Arr, HashMap, Match, Option, pipe, Schema, String as Str } from "effect";
import type { ResearchUIMessage } from "@/shared/chat";

export type ToolOutcome = "pending" | "ok" | "failed";

export type TraceRow = {
  key: string;
  kind: "thought" | "action";
  primary: string;
  secondary?: string;
  streaming?: boolean;
  outcome?: ToolOutcome;
};

const TOOL_LABELS = HashMap.make(
  ["searchCompanies", "Searched companies"],
  ["getCompanyProfile", "Read company profile"],
  ["getFinancials", "Pulled financials"],
  ["searchDocuments", "Searched documents"],
);

const TOOL_OUTCOMES: Partial<Record<ToolUIPart["state"], ToolOutcome>> = {
  "output-available": "ok",
  "output-error": "failed",
};

const Subject = Schema.Struct({
  company: Schema.optionalKey(Schema.String),
  query: Schema.optionalKey(Schema.String),
});

export const traceRows = (message: ResearchUIMessage): TraceRow[] =>
  Arr.flatMap(message.parts, (part, index) =>
    Match.value(part).pipe(
      Match.when({ type: "reasoning" }, ({ text }) =>
        text
          .split(/\n\s*\n/)
          .map(Str.trim)
          .filter(Str.isNonEmpty)
          .map((primary, paragraph): TraceRow => ({ key: `thought-${index}-${paragraph}`, kind: "thought", primary })),
      ),
      Match.when(isToolUIPart, (tool): TraceRow[] => [
        {
          key: tool.toolCallId,
          kind: "action",
          primary: Option.getOrElse(HashMap.get(TOOL_LABELS, getToolName(tool)), () => getToolName(tool)),
          secondary: Schema.decodeUnknownOption(Subject)(tool.input).pipe(
            Option.flatMap((fields) => Option.fromNullishOr(fields.company ?? fields.query)),
            Option.getOrElse(() => ""),
          ),
          outcome: TOOL_OUTCOMES[tool.state] ?? "pending",
        },
      ]),
      Match.orElse(() => []),
    ),
  );

export const traceHeadline = (rows: ReadonlyArray<TraceRow>): string =>
  Option.match(Arr.last(rows), {
    onNone: () => "Thinking",
    onSome: Match.type<TraceRow>().pipe(
      Match.when({ outcome: Match.is("ok", "failed") }, () => "Thinking"),
      Match.when({ secondary: Match.nonEmptyString }, ({ primary, secondary }) => `${primary} · ${secondary}`),
      Match.orElse(({ primary }) => primary),
    ),
  });

export const traceSources = (rows: ReadonlyArray<TraceRow>): string[] =>
  pipe(
    rows,
    Arr.filter((row) => row.outcome === "ok"),
    Arr.map((row) => row.secondary ?? ""),
    Arr.filter(Str.isNonEmpty),
    Arr.dedupe,
  );

export const traceSummary = (rows: ReadonlyArray<TraceRow>): string =>
  Match.value(Arr.filter(rows, (row) => row.kind === "action").length).pipe(
    Match.when(0, () => "Thought it through"),
    Match.when(1, () => "Thought it through · 1 source"),
    Match.orElse((count) => `Thought it through · ${count} sources`),
  );
