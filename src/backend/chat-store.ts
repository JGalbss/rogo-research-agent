import { Array as Arr, Context, Data, DateTime, Effect, Layer, Option, Schema, pipe } from "effect";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type Chat, ChatId, ChatMessage, type ChatSummary, type ResearchUIMessage } from "../shared/chat.ts";
import { ChatIndex, type ChatIndexError } from "./chat-index.ts";

export class ChatStoreError extends Data.TaggedError("ChatStoreError")<{
  readonly id: string;
  readonly cause: unknown;
}> {}

interface ChatStoreApi {
  readonly get: (id: ChatId) => Effect.Effect<Option.Option<Chat>, ChatStoreError>;
  readonly put: (chat: Chat) => Effect.Effect<void, ChatStoreError | ChatIndexError>;
  readonly list: Effect.Effect<ReadonlyArray<ChatSummary>, ChatStoreError>;
}

export class ChatStore extends Context.Service<ChatStore, ChatStoreApi>()("ChatStore") {}

export const newChat = (id: ChatId): Effect.Effect<Chat> =>
  DateTime.now.pipe(Effect.map((now) => ({ id, createdAt: DateTime.formatIso(now), messages: [] })));

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

const StoredMessages = Schema.fromJsonString(Schema.Array(ChatMessage));

const ChatRow = Schema.Struct({
  id: ChatId,
  created_at: Schema.String,
  messages: StoredMessages,
});

export const ChatStoreSqlite = (file: string): Layer.Layer<ChatStore, never, ChatIndex> =>
  Layer.effect(
    ChatStore,
    Effect.gen(function* () {
      const index = yield* ChatIndex;
      const db = yield* Effect.acquireRelease(
        Effect.sync(() => {
          mkdirSync(path.dirname(file), { recursive: true });
          const database = new DatabaseSync(file);
          database.exec(
            "create table if not exists chats (id text primary key, created_at text not null, messages text not null)",
          );
          return database;
        }),
        (database) => Effect.sync(() => database.close()),
      );
      const selectChat = db.prepare("select id, created_at, messages from chats where id = ?");
      const selectAll = db.prepare("select id, created_at, messages from chats order by created_at desc");
      const writeChat = db.prepare(
        "insert into chats (id, created_at, messages) values (?, ?, ?) on conflict(id) do update set messages = excluded.messages",
      );
      const decodeRows = Schema.decodeUnknownEffect(Schema.Array(ChatRow));

      const get: ChatStoreApi["get"] = (id) =>
        Effect.try({
          try: () => selectChat.all(id),
          catch: (cause) => new ChatStoreError({ id, cause }),
        }).pipe(
          Effect.flatMap(decodeRows),
          Effect.mapError((cause) => new ChatStoreError({ id, cause })),
          Effect.map((rows) =>
            Option.map(Arr.head(rows), (row): Chat => ({
              id: row.id,
              createdAt: row.created_at,
              messages: row.messages,
            })),
          ),
        );

      const put: ChatStoreApi["put"] = (chat) =>
        Effect.gen(function* () {
          const previous = yield* get(chat.id);
          const known = Option.match(previous, {
            onNone: () => 0,
            onSome: (existing) => existing.messages.length,
          });
          yield* Effect.try({
            try: () =>
              writeChat.run(chat.id, chat.createdAt, Schema.encodeSync(StoredMessages)(chat.messages)),
            catch: (cause) => new ChatStoreError({ id: chat.id, cause }),
          });
          if (Option.isNone(previous)) {
            yield* index.emit({ _tag: "ChatCreated", id: chat.id, createdAt: chat.createdAt });
          }
          yield* Effect.forEach(chat.messages.slice(known), (message) =>
            index.emit({ _tag: "MessageAppended", chatId: chat.id, message }),
          );
        });

      const list: ChatStoreApi["list"] = Effect.try({
        try: () => selectAll.all(),
        catch: (cause) => new ChatStoreError({ id: "*", cause }),
      }).pipe(
        Effect.flatMap(decodeRows),
        Effect.mapError((cause) => new ChatStoreError({ id: "*", cause })),
        Effect.map(
          Arr.map((row) => ({ id: row.id, title: chatTitle(row.messages), createdAt: row.created_at })),
        ),
      );

      return { get, put, list };
    }),
  );

export const ChatStoreLive: Layer.Layer<ChatStore, never, ChatIndex> = ChatStoreSqlite(".data/chats.sqlite");
