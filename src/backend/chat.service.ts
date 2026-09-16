import { Array as Arr, type Config, Context, Data, DateTime, Effect, Layer, type Option, Schema } from "effect";
import { SqlClient, type SqlError, SqlSchema } from "effect/unstable/sql";
import { type Chat, ChatId, ChatMessage, type ChatSummary, chatTitle } from "../shared/chat.ts";
import { DatabaseLive } from "./db/database.ts";
import { ChatRow } from "./db/schema.ts";

export class ChatStoreError extends Data.TaggedError("ChatStoreError")<{
  readonly id: string;
  readonly cause: unknown;
}> {}

interface ChatStoreApi {
  readonly get: (id: ChatId) => Effect.Effect<Option.Option<Chat>, ChatStoreError>;
  readonly put: (chat: Chat) => Effect.Effect<void, ChatStoreError>;
  readonly list: Effect.Effect<ReadonlyArray<ChatSummary>, ChatStoreError>;
}

export class ChatStore extends Context.Service<ChatStore, ChatStoreApi>()("ChatStore") {}

const plainMessages = Schema.decodeUnknownSync(Schema.Array(ChatMessage));

export const newChat = (id: ChatId): Effect.Effect<Chat> =>
  DateTime.now.pipe(Effect.map((now) => ({ id, createdAt: DateTime.formatIso(now), messages: [] })));

const ChatStoreSql: Layer.Layer<ChatStore, never, SqlClient.SqlClient> = Layer.effect(
  ChatStore,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const findChat = SqlSchema.findOneOption({
      Request: ChatId,
      Result: ChatRow,
      execute: (id) => sql`select * from chats where id = ${id}`,
    });

    const findChats = SqlSchema.findAll({
      Request: Schema.Void,
      Result: ChatRow,
      execute: () => sql`select * from chats order by created_at desc`,
    });

    const get: ChatStoreApi["get"] = (id) =>
      findChat(id).pipe(Effect.mapError((cause) => new ChatStoreError({ id, cause })));

    const put: ChatStoreApi["put"] = (chat) =>
      Effect.gen(function* () {
        const row = yield* Schema.encodeEffect(ChatRow.insert)({
          ...chat,
          messages: plainMessages(JSON.parse(JSON.stringify(chat.messages))),
        });
        yield* sql`insert into chats ${sql.insert(row)} on conflict(id) do update set messages = excluded.messages`;
      }).pipe(
        Effect.catchTags({
          SqlError: (cause) => new ChatStoreError({ id: chat.id, cause }),
          SchemaError: (cause) => new ChatStoreError({ id: chat.id, cause }),
        }),
      );

    const list: ChatStoreApi["list"] = findChats(undefined).pipe(
      Effect.map(Arr.map((row) => ({ id: row.id, title: chatTitle(row.messages), createdAt: row.createdAt }))),
      Effect.mapError((cause) => new ChatStoreError({ id: "*", cause })),
    );

    return { get, put, list };
  }),
);

export const ChatStoreLive: Layer.Layer<ChatStore, Config.ConfigError | SqlError.SqlError> = ChatStoreSql.pipe(
  Layer.provide(DatabaseLive),
);
