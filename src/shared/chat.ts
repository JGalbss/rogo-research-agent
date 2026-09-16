import { createStateSchema } from "@durable-streams/state";
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

export const ChatSummary = Schema.Struct({
  id: ChatId,
  title: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  generating: Schema.Boolean,
});
export type ChatSummary = typeof ChatSummary.Type;

export const CHATS_STREAM_PATH = "/chats";

export const chatsState = createStateSchema({
  chats: {
    schema: Schema.toStandardSchemaV1(ChatSummary),
    type: "chat",
    primaryKey: "id",
  },
});
