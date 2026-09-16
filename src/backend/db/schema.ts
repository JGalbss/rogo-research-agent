import { Effect, Schema } from "effect";
import { Model } from "effect/unstable/schema";
import { SqlClient } from "effect/unstable/sql";
import { ChatId, ChatMessage } from "../../shared/chat.ts";

export class ChatRow extends Model.Class<ChatRow>("ChatRow")({
  id: ChatId,
  createdAt: Schema.String,
  messages: Model.JsonFromString(Schema.Array(ChatMessage)),
}) {}

export const createTables = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`
    create table if not exists chats (
      id text primary key,
      created_at text not null,
      messages text not null
    )
  `;
});
