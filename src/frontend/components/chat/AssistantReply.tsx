import { Data, Match, String as Str } from "effect";
import type { ReactElement } from "react";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import type { ResearchUIMessage } from "@/shared/chat";
import { answerText, isStreaming, traceRows } from "./message-parts.ts";
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
  const text = answerText(message);
  const working = !settled && text.length === 0;
  const reply = Match.value({ settled, text, streaming: isStreaming(message) }).pipe(
    Match.when({ text: Str.isNonEmpty }, ({ text: answer, streaming }) => Reply.Answer({ text: answer, streaming })),
    Match.when({ settled: true }, () => Reply.OutOfSteps()),
    Match.orElse(() => Reply.Pending()),
  );
  const rows = traceRows(message);
  const sources = rows.filter((row) => row.kind === "action").length;
  const trace =
    rows.length === 0 && !working ? null : (
      <ThinkingState
        variant="Coding"
        rows={rows}
        active="Thinking"
        done={sources === 0 ? "Thought it through" : `Thought it through · ${sources} ${sources === 1 ? "source" : "sources"}`}
        working={working}
        settled={settled}
      />
    );

  return (
    <div className="flex w-full flex-col gap-3">
      {trace}
      {answerSlot(reply)}
    </div>
  );
}
