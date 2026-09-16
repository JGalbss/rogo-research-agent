import type { ChatStatus } from "ai";
import { Data, Match } from "effect";

export type ChatView = Data.TaggedEnum<{
  Empty: {};
  Idle: {};
  Submitted: {};
  Streaming: {};
  Failed: { readonly message: string };
}>;

export const ChatView = Data.taggedEnum<ChatView>();

export const classifyChatView = (input: {
  readonly status: ChatStatus;
  readonly messageCount: number;
  readonly error: Error | undefined;
}): ChatView =>
  Match.value(input).pipe(
    Match.when({ status: "error" }, ({ error }) =>
      ChatView.Failed({ message: error?.message ?? "unknown error" }),
    ),
    Match.when({ status: "submitted" }, () => ChatView.Submitted()),
    Match.when({ status: "streaming" }, () => ChatView.Streaming()),
    Match.when({ messageCount: 0 }, () => ChatView.Empty()),
    Match.orElse(() => ChatView.Idle()),
  );

export const acceptsInput = ChatView.$match({
  Empty: () => true,
  Idle: () => true,
  Failed: () => true,
  Submitted: () => false,
  Streaming: () => false,
});
