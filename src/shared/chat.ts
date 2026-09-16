import type { InferUITools, UIMessage } from "ai";
import { Schema } from "effect";
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
