import type { ReactElement } from "react";
import { useLiveTrace } from "@/frontend/hooks/use-live-trace";
import type { ResearchUIMessage } from "@/shared/chat";
import { Reply, classifyReply } from "./message-parts.ts";
import { Prose } from "./Prose.tsx";
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
  settled,
}: {
  message: ResearchUIMessage;
  settled: boolean;
}): ReactElement {
  const reply = classifyReply(message, settled ? "settled" : "open");
  const rows = useLiveTrace(reply);
  return (
    <div className="flex w-full flex-col gap-3">
      <TraceView rows={rows} working={Reply.$is("Working")(reply)} settled={settled} />
      {answer(reply)}
    </div>
  );
}
