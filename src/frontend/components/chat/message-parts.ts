import { getToolName, isToolUIPart } from "ai";
import { Array as Arr, Match, pipe, String as Str } from "effect";
import type { StreamingToken } from "@/frontend/components/primitives/StreamingText";
import type { ResearchUIMessage } from "@/shared/chat";

export type Part = ResearchUIMessage["parts"][number];
export type ToolPart = Extract<Part, { toolCallId: string }>;

export type TraceRow = { primary: string; secondary?: string; mono?: boolean };

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

export const reasoningRows = (message: ResearchUIMessage): TraceRow[] =>
  pipe(
    message.parts,
    Arr.flatMap((part) => (part.type === "reasoning" ? part.text.split(/\n\s*\n/) : [])),
    Arr.map(Str.trim),
    Arr.filter(Str.isNonEmpty),
    Arr.map((primary) => ({ primary })),
  );

export const traceRows = (message: ResearchUIMessage): TraceRow[] =>
  pipe(
    message.parts,
    Arr.filter(isToolUIPart),
    Arr.map((part: ToolPart) => ({
      primary: getToolName(part),
      secondary: Match.value(part).pipe(
        Match.when({ state: "output-error" }, ({ errorText }) => `failed: ${errorText ?? "unknown"}`),
        Match.orElse(({ input }) => JSON.stringify(input ?? {})),
      ),
      mono: true,
    })),
  );
