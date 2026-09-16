import { createStateSchema } from "@durable-streams/state";
import { Schema } from "effect";
import { ChatId, ChatMessage } from "./chat.ts";

export const ChatEvent = Schema.Union([
  Schema.Struct({
    _tag: Schema.Literal("ChatCreated"),
    id: ChatId,
    createdAt: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("MessageAppended"),
    chatId: ChatId,
    message: ChatMessage,
  }),
  Schema.Struct({
    _tag: Schema.Literal("GenerationStarted"),
    chatId: ChatId,
    streamId: Schema.String,
    readUrl: Schema.String,
  }),
  Schema.Struct({
    _tag: Schema.Literal("GenerationFinished"),
    chatId: ChatId,
    streamId: Schema.String,
  }),
]);
export type ChatEvent = typeof ChatEvent.Type;

export const ChatEventRecord = Schema.Struct({
  id: Schema.String,
  event: ChatEvent,
});
export type ChatEventRecord = typeof ChatEventRecord.Type;

export const CHATS_STREAM_PATH = "/chats";

export const chatEventsState = createStateSchema({
  events: {
    schema: Schema.toStandardSchemaV1(ChatEventRecord),
    type: "chat-event",
    primaryKey: "id",
  },
});
