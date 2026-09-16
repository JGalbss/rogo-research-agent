import { Array as Arr, Data, Match, String as Str } from "effect";
import type { ReactElement } from "react";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import type { ResearchUIMessage } from "@/shared/chat";
import { answerText, isStreaming, reasoningRows, traceRows } from "./message-parts.ts";
import { Prose } from "./Prose.tsx";

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

type Reply = Data.TaggedEnum<{
  Answer: { readonly text: string; readonly streaming: boolean };
  OutOfSteps: {};
  Pending: {};
}>;

const Reply = Data.taggedEnum<Reply>();

const answerSlot = Reply.$match({
  Answer: ({ text, streaming }) => <Prose text={text} streaming={streaming} />,
  OutOfSteps: () => <Prose text={OUT_OF_STEPS_ANSWER} streaming={false} />,
  Pending: () => null,
});

export function AssistantReply({
  message,
  settled,
}: {
  message: ResearchUIMessage;
  settled: boolean;
}): ReactElement {
  const reply = Match.value({ settled, text: answerText(message), streaming: isStreaming(message) }).pipe(
    Match.when({ text: Str.isNonEmpty }, ({ text, streaming }) => Reply.Answer({ text, streaming })),
    Match.when({ settled: true }, () => Reply.OutOfSteps()),
    Match.orElse(() => Reply.Pending()),
  );
  const reasoning = Arr.match(reasoningRows(message), {
    onEmpty: () => null,
    onNonEmpty: (rows) => (
      <ThinkingState
        variant="Reasoning"
        rows={Array.from(rows)}
        active="Thinking"
        done="Thought it through"
        settled={settled}
      />
    ),
  });
  const trace = Arr.match(traceRows(message), {
    onEmpty: () => null,
    onNonEmpty: (rows) => (
      <ThinkingState
        variant="Coding"
        rows={Array.from(rows)}
        active="Researching"
        done={rows.length === 1 ? "Checked 1 source" : `Checked ${rows.length} sources`}
        settled={settled}
      />
    ),
  });

  return (
    <div className="flex w-full flex-col gap-3">
      {reasoning}
      {trace}
      {answerSlot(reply)}
    </div>
  );
}
