import { Array as Arr, Data, Option } from "effect";
import type { ResearchUIMessage } from "@/shared/chat";
import { type TraceRow, traceRows } from "@/frontend/utils/trace";

export type TurnPhase = "live" | "settled";

type Part = ResearchUIMessage["parts"][number];

export type ReplySegment = Data.TaggedEnum<{
  Trace: { readonly rows: TraceRow[] };
  Answer: { readonly text: string };
}>;

export const ReplySegment = Data.taggedEnum<ReplySegment>();

const isText = (part: Part): boolean => part.type === "text";

export const messageText = (parts: ReadonlyArray<Part>): string =>
  Arr.join(
    Arr.flatMap(parts, (part) => (part.type === "text" ? [part.text] : [])),
    "\n\n",
  );

export const replySegments = (message: ResearchUIMessage): ReplySegment[] =>
  Arr.match(message.parts, {
    onEmpty: () => [],
    onNonEmpty: (parts) =>
      Arr.map(
        Arr.groupWith(parts, (a, b) => isText(a) === isText(b)),
        (group) =>
          isText(group[0])
            ? ReplySegment.Answer({ text: messageText(group) })
            : ReplySegment.Trace({ rows: traceRows(group) }),
      ),
  });

export type Reply = Data.TaggedEnum<{
  Live: { readonly segments: ReplySegment[] };
  Done: { readonly rows: TraceRow[]; readonly answer: string };
  OutOfSteps: { readonly rows: TraceRow[] };
}>;

export const Reply = Data.taggedEnum<Reply>();

const workRows = (segments: ReadonlyArray<ReplySegment>): TraceRow[] =>
  Arr.flatMap(segments, (segment, index) =>
    ReplySegment.$match(segment, {
      Trace: ({ rows }) => rows,
      Answer: ({ text }): TraceRow[] => [
        { key: `message-${index}`, kind: "thought", primary: text },
      ],
    }),
  );

export const classifyReply = (
  message: ResearchUIMessage,
  turn: TurnPhase,
): Reply => {
  const segments = replySegments(message);
  if (turn === "live") return Reply.Live({ segments });
  return Option.match(
    Option.filter(Arr.last(segments), ReplySegment.$is("Answer")),
    {
      onNone: () => Reply.OutOfSteps({ rows: workRows(segments) }),
      onSome: ({ text }) =>
        Reply.Done({
          rows: workRows(Arr.dropRight(segments, 1)),
          answer: text,
        }),
    },
  );
};
