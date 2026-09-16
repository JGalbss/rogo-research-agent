import type { InferUITools, UIMessage } from "ai";
import { Array as Arr, Option, Schema, pipe } from "effect";
import type { AgentEvent } from "./agent-event.ts";
import type { researchTools } from "../backend/agent/tools/index.ts";

export type ResearchDataParts = {
  readonly "agent-event": AgentEvent;
};

export type ResearchUIMessage = UIMessage<
  unknown,
  ResearchDataParts,
  InferUITools<typeof researchTools>
>;

export const ChatId = Schema.String.check(Schema.isPattern(/^[A-Za-z0-9_-]{1,64}$/));
export type ChatId = typeof ChatId.Type;

const MessageEnvelope = Schema.Struct({
  id: Schema.String,
  role: Schema.Union([Schema.Literal("user"), Schema.Literal("assistant"), Schema.Literal("system")]),
  parts: Schema.Array(Schema.Struct({ type: Schema.String })),
});

export const ChatMessage = Schema.declare(
  (input: unknown): input is ResearchUIMessage => Schema.is(MessageEnvelope)(input),
  { title: "ChatMessage" },
);

export const Chat = Schema.Struct({
  id: ChatId,
  createdAt: Schema.String,
  messages: Schema.Array(ChatMessage),
});
export type Chat = typeof Chat.Type;

export const ChatSummary = Schema.Struct({
  id: ChatId,
  title: Schema.String,
  createdAt: Schema.String,
});
export type ChatSummary = typeof ChatSummary.Type;

const TITLE_LENGTH = 40;

export const chatTitle = (messages: ReadonlyArray<ResearchUIMessage>): string =>
  pipe(
    messages,
    Arr.findFirst((message) => message.role === "user"),
    Option.map((message) =>
      message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join(" "),
    ),
    Option.filter((text) => text.length > 0),
    Option.map((text) => (text.length <= TITLE_LENGTH ? text : `${text.slice(0, TITLE_LENGTH)}…`)),
    Option.getOrElse(() => "New chat"),
  );
