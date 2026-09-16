import { Match } from "effect";
import type { ReactElement } from "react";
import type { ResearchUIMessage } from "@/shared/chat";
import { AssistantReply } from "./AssistantReply.tsx";
import { answerText } from "./message-parts.ts";
import { UserMessage } from "./UserMessage.tsx";

export function MessageBubble({
  message,
  settled,
}: {
  message: ResearchUIMessage;
  settled: boolean;
}): ReactElement {
  return Match.value(message.role).pipe(
    Match.when("user", () => <UserMessage text={answerText(message)} />),
    Match.orElse(() => <AssistantReply message={message} settled={settled} />),
  );
}
