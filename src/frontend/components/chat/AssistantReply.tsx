import { Array as Arr } from "effect";
import type { ReactElement } from "react";
import type { ResearchUIMessage } from "@/shared/chat";
import { Prose } from "./Prose.tsx";
import {
  ReplySegment,
  type TurnPhase,
  replySegments,
} from "@/frontend/utils/reply";
import { TraceView } from "./TraceView.tsx";

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

export function AssistantReply({
  message,
  turn,
}: {
  message: ResearchUIMessage;
  turn: TurnPhase;
}): ReactElement {
  const segments = replySegments(message);
  const last = segments.length - 1;
  const live = turn === "live";
  const outOfSteps =
    turn === "settled" && Arr.every(segments, ReplySegment.$is("Trace"));

  return (
    <div className="flex w-full flex-col gap-3">
      {segments.map((segment, index) =>
        ReplySegment.$match(segment, {
          Trace: ({ rows }) => (
            <TraceView
              key={index}
              rows={rows}
              working={live && index === last}
              settled={turn === "settled"}
            />
          ),
          Answer: ({ text }) => (
            <Prose key={index} text={text} streaming={live && index === last} />
          ),
        }),
      )}
      {outOfSteps ? (
        <Prose text={OUT_OF_STEPS_ANSWER} streaming={false} />
      ) : null}
    </div>
  );
}
