import type { ChatStatus } from "ai";
import { Data, Match, Option } from "effect";
import type { ReactNode } from "react";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";

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

export interface ViewTraits {
  readonly greeting: boolean;
  readonly liveTurn: boolean;
  readonly indicator: ReactNode;
}

const idle: ViewTraits = { greeting: false, liveTurn: false, indicator: null };

const thinking = <ThinkingState variant="Coding" rows={[]} active="Thinking" working />;

export const viewTraits = ChatView.$match({
  Empty: (): ViewTraits => ({ ...idle, greeting: true }),
  Loading: (): ViewTraits => idle,
  Idle: (): ViewTraits => idle,
  Submitted: (): ViewTraits => ({ ...idle, liveTurn: true, indicator: thinking }),
  Awaiting: (): ViewTraits => ({ ...idle, liveTurn: true, indicator: thinking }),
  Streaming: (): ViewTraits => ({ ...idle, liveTurn: true }),
  Failed: ({ message }): ViewTraits => ({
    ...idle,
    indicator: <p className="text-[13px] text-red">Something went wrong: {message}</p>,
  }),
});
