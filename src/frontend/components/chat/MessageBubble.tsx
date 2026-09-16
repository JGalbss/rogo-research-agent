import { Match } from "effect";
import type { ReactElement } from "react";
import type { ResearchUIMessage } from "@/shared/chat";
import { Prose } from "./Prose.tsx";
import { ToolTrace } from "./ToolTrace.tsx";

const OUT_OF_STEPS_ANSWER =
  "I looked at a number of sources but ran out of research steps before I could pull the answer together. Try asking a narrower question.";

export function MessageBubble({
  message,
  settled,
}: {
  message: ResearchUIMessage;
  settled: boolean;
}): ReactElement {
  const body = message.parts.map((part, index) =>
    Match.value(part).pipe(
      Match.when({ type: "text" }, ({ text, state }) => (
        <Prose key={`text-${index}`} text={text} streaming={state === "streaming"} />
      )),
      Match.when({ type: "reasoning" }, ({ text }) => (
        <p key={`reasoning-${index}`} className="text-[13px] text-ink-2 italic">
          {text}
        </p>
      )),
      Match.orElse(() => null),
    ),
  );

  if (message.role === "user") {
    return (
      <div className="max-w-[88%] self-end rounded-xl bg-ink px-4 py-3 text-canvas">{body}</div>
    );
  }

  const hasText = message.parts.some((part) => part.type === "text");
  return (
    <div className="flex max-w-[88%] flex-col gap-2 self-start rounded-xl border border-line bg-surface px-4 py-3 text-ink shadow-card">
      <ToolTrace parts={message.parts} />
      {body}
      {settled && !hasText ? <Prose text={OUT_OF_STEPS_ANSWER} streaming={false} /> : null}
    </div>
  );
}
