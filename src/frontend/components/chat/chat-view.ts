import type { ChatStatus } from "ai";
import { Data, Match, Option } from "effect";

export type ChatView = Data.TaggedEnum<{
  Empty: {};
  Loading: {};
  Idle: {};
  Submitted: {};
  Awaiting: {};
  Streaming: {};
  Failed: { readonly message: string };
}>;

export const ChatView = Data.taggedEnum<ChatView>();

export const classifyChatView = (input: {
  readonly status: ChatStatus;
  readonly messageCount: number;
  readonly lastRole: Option.Option<string>;
  readonly error: Error | undefined;
  readonly stored: boolean;
}): ChatView =>
  Match.value({ ...input, replyStarted: Option.contains(input.lastRole, "assistant") }).pipe(
    Match.when({ status: "error" }, ({ error }) =>
      ChatView.Failed({ message: error?.message ?? "unknown error" }),
    ),
    Match.when({ status: "submitted" }, () => ChatView.Submitted()),
    Match.when({ status: "streaming", replyStarted: false }, () => ChatView.Awaiting()),
    Match.when({ status: "streaming" }, () => ChatView.Streaming()),
    Match.when({ messageCount: 0, stored: true }, () => ChatView.Loading()),
    Match.when({ messageCount: 0 }, () => ChatView.Empty()),
    Match.orElse(() => ChatView.Idle()),
  );

