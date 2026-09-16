import type { ReactElement } from "react";
import type { ResearchUIMessage } from "@/shared/chat";
import { Prose } from "./Prose.tsx";
import { Reply, ReplySegment, type TurnPhase, classifyReply } from "@/frontend/utils/reply";
import { TraceView } from "./TraceView.tsx";

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

const body = Reply.$match({
  Live: ({ segments }) =>
    segments.map((segment, index) =>
      ReplySegment.$match(segment, {
        Trace: ({ rows }) => (
          <TraceView key={index} rows={rows} working={index === segments.length - 1} settled={false} />
        ),
        Answer: ({ text }) => <Prose key={index} text={text} streaming={index === segments.length - 1} />,
      }),
    ),
  Done: ({ rows, answer }) => (
    <>
      <TraceView rows={rows} working={false} settled />
      <Prose text={answer} streaming={false} />
    </>
  ),
  OutOfSteps: ({ rows }) => (
    <>
      <TraceView rows={rows} working={false} settled />
      <Prose text={OUT_OF_STEPS_ANSWER} streaming={false} />
    </>
  ),
});

export function AssistantReply({
  message,
  turn,
}: {
  message: ResearchUIMessage;
  turn: TurnPhase;
}): ReactElement {
  return <div className="flex w-full flex-col gap-3">{body(classifyReply(message, turn))}</div>;
}
