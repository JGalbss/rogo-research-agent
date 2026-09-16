import { Array as Arr, Data, Match, String as Str } from "effect";
import type { ReactElement } from "react";
import StreamingText from "@/frontend/components/primitives/StreamingText";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import type { ResearchUIMessage } from "@/shared/chat";
import { answerText, answerTokens, traceRows } from "./message-parts.ts";

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

type Reply = Data.TaggedEnum<{
  Answer: { readonly text: string };
  OutOfSteps: {};
  Pending: {};
}>;

const Reply = Data.taggedEnum<Reply>();

const answerSlot = Reply.$match({
  Answer: ({ text }) => (
    <StreamingText
      content={answerTokens(text)}
      sources={[]}
      followUps={[]}
      loop={false}
      fill
      labels={{ sources: "", followUps: "" }}
    />
  ),
  OutOfSteps: () => (
    <StreamingText
      content={answerTokens(OUT_OF_STEPS_ANSWER)}
      sources={[]}
      followUps={[]}
      loop={false}
      fill
      labels={{ sources: "", followUps: "" }}
    />
  ),
  Pending: () => null,
});

export function AssistantReply({
  message,
  settled,
}: {
  message: ResearchUIMessage;
  settled: boolean;
}): ReactElement {
  const reply = Match.value({ settled, text: answerText(message) }).pipe(
    Match.when({ text: Str.isNonEmpty }, ({ text }) => Reply.Answer({ text })),
    Match.when({ settled: true }, () => Reply.OutOfSteps()),
    Match.orElse(() => Reply.Pending()),
  );
  const trace = Arr.match(traceRows(message), {
    onEmpty: () => null,
    onNonEmpty: (rows) => (
      <ThinkingState
        variant="Coding"
        rows={Array.from(rows)}
        active="Researching"
        done={`Ran ${rows.length} tools`}
      />
    ),
  });

  return (
    <div className="flex w-full flex-col gap-3">
      {trace}
      {answerSlot(reply)}
    </div>
  );
}
