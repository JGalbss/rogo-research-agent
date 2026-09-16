import { Array as Arr, Data, Match, pipe, String as Str } from "effect";
import type { ResearchUIMessage } from "@/shared/chat";
import { type TraceRow, traceRows } from "@/frontend/utils/trace";

export type TurnPhase = "live" | "settled";

export type Reply = Data.TaggedEnum<{
  Working: { readonly rows: TraceRow[] };
  Answering: { readonly rows: TraceRow[]; readonly text: string };
  Done: { readonly rows: TraceRow[]; readonly text: string };
  OutOfSteps: { readonly rows: TraceRow[] };
}>;

export const Reply = Data.taggedEnum<Reply>();

export const messageText = (message: ResearchUIMessage): string =>
  pipe(
    message.parts,
    Arr.flatMap((part) => (part.type === "text" ? [part.text] : [])),
    Arr.join("\n\n"),
  );

export const classifyReply = (message: ResearchUIMessage, turn: TurnPhase): Reply => {
  const rows = traceRows(message);
  return Match.value({ turn, text: messageText(message) }).pipe(
    Match.when({ turn: "live", text: Str.isEmpty }, () => Reply.Working({ rows })),
    Match.when({ turn: "live" }, ({ text }) => Reply.Answering({ rows, text })),
    Match.when({ text: Str.isEmpty }, () => Reply.OutOfSteps({ rows })),
    Match.orElse(({ text }) => Reply.Done({ rows, text })),
  );
};
