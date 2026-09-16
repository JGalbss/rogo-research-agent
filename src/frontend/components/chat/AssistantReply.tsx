import type { ReactElement } from "react";
import StreamingText from "@/frontend/components/primitives/StreamingText";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import type { ResearchUIMessage } from "@/shared/chat";
import { answerText, answerTokens, traceRows } from "./message-parts.ts";

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

export function AssistantReply({
  message,
  settled,
}: {
  message: ResearchUIMessage;
  settled: boolean;
}): ReactElement {
  const rows = traceRows(message);
  const text = answerText(message);
  const shown = settled && text.length === 0 ? OUT_OF_STEPS_ANSWER : text;

  return (
    <div className="flex w-full flex-col gap-3">
      {rows.length > 0 ? (
        <ThinkingState
          variant="Coding"
          rows={rows}
          active="Researching"
          done={`Ran ${rows.length} tools`}
        />
      ) : null}
      {shown.length > 0 ? (
        <StreamingText
          content={answerTokens(shown)}
          sources={[]}
          followUps={[]}
          loop={false}
          fill
          labels={{ sources: "", followUps: "" }}
          
        />
      ) : null}
    </div>
  );
}
