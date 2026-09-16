import type { ReactElement } from "react";
import { useLiveTrace } from "@/frontend/hooks/use-live-trace";
import type { ResearchUIMessage } from "@/shared/chat";
import { Prose } from "./Prose.tsx";
import { Reply, type TurnPhase, classifyReply } from "@/frontend/utils/reply";
import { TraceView } from "./TraceView.tsx";

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

const answer = Reply.$match({
  Working: () => null,
  Answering: ({ text }) => <Prose text={text} streaming />,
  Done: ({ text }) => <Prose text={text} streaming={false} />,
  OutOfSteps: () => <Prose text={OUT_OF_STEPS_ANSWER} streaming={false} />,
});

export function AssistantReply({
  message,
  turn,
}: {
  message: ResearchUIMessage;
  turn: TurnPhase;
}): ReactElement {
  const reply = classifyReply(message, turn);
  return (
    <div className="flex w-full flex-col gap-3">
      <TraceView rows={useLiveTrace(reply)} reply={reply} turn={turn} />
      {answer(reply)}
    </div>
  );
}
