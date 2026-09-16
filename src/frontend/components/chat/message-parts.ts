import { getToolName, isToolUIPart } from "ai";
import { Array as Arr, HashMap, Match, Option, pipe, Schema, String as Str } from "effect";
import type { StreamingToken } from "@/frontend/components/primitives/StreamingText";
import type { ResearchUIMessage } from "@/shared/chat";

export type Part = ResearchUIMessage["parts"][number];
export type ToolPart = Extract<Part, { toolCallId: string }>;

export type TraceRow = {
  key: string;
  kind: "thought" | "action";
  primary: string;
  secondary?: string;
  mono?: boolean;
  streaming?: boolean;
};

export const answerText = (message: ResearchUIMessage): string =>
  pipe(message.parts, Arr.flatMap((part) => (part.type === "text" ? [part.text] : [])), Arr.join("\n\n"));

export const isStreaming = (message: ResearchUIMessage): boolean =>
  Arr.some(message.parts, (part) => part.type === "text" && part.state === "streaming");

export const answerTokens = (text: string): StreamingToken[] =>
  pipe(
    text.split(/\s+/),
    Arr.filter(Str.isNonEmpty),
    Arr.map((word) => ({ text: word })),
  );

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
  Arr.flatMap(message.parts, (part, partIndex) =>
    Match.value(part).pipe(
      Match.when({ type: "reasoning" }, ({ text }) =>
        pipe(
          text.split(/\n\s*\n/),
          Arr.map(Str.trim),
          Arr.filter(Str.isNonEmpty),
          Arr.map((primary, paragraph): TraceRow => ({
            key: `thought-${partIndex}-${paragraph}`,
            kind: "thought",
            primary,
          })),
        ),
      ),
      Match.when(isToolUIPart, (tool: ToolPart): TraceRow[] => {
        const name = getToolName(tool);
        return [
          {
            key: tool.toolCallId,
            kind: "action",
            primary: Option.getOrElse(HashMap.get(TOOL_LABELS, name), () => name),
            secondary: Match.value(tool).pipe(
              Match.when({ state: "output-error" }, ({ errorText }) => `failed: ${errorText ?? "unknown"}`),
              Match.orElse(({ input }) =>
                Schema.decodeUnknownOption(Subject)(input).pipe(
                  Option.flatMap((subject) => Option.fromNullishOr(subject.company ?? subject.query)),
                  Option.getOrElse(() => ""),
                ),
              ),
            ),
          },
        ];
      }),
      Match.orElse(() => []),
    ),
  );
