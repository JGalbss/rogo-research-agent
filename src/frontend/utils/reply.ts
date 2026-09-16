import { Array as Arr, Data, Match, Option, pipe, String as Str } from "effect";
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
  const answering = Option.contains(Option.map(Arr.last(message.parts), (part) => part.type), "text");
  return Match.value({ turn, answering, text: messageText(message) }).pipe(
    Match.when({ turn: "live", answering: true }, ({ text }) => Reply.Answering({ rows, text })),
    Match.when({ turn: "live" }, () => Reply.Working({ rows })),
    Match.when({ text: Str.isEmpty }, () => Reply.OutOfSteps({ rows })),
    Match.orElse(({ text }) => Reply.Done({ rows, text })),
  );
};
