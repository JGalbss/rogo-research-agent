import { Match } from "effect";
import { memo, type ReactElement } from "react";
import type { ResearchUIMessage } from "@/shared/chat";
import { AssistantReply } from "./AssistantReply.tsx";
import { type TurnPhase, messageText } from "@/frontend/utils/reply";
import { UserMessage } from "./UserMessage.tsx";

export const MessageBubble = memo(
  ({ message, turn }: { message: ResearchUIMessage; turn: TurnPhase }): ReactElement =>
    Match.value(message.role).pipe(
      Match.when("user", () => <UserMessage text={messageText(message)} />),
      Match.orElse(() => <AssistantReply message={message} turn={turn} />),
    ),
);
