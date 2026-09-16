import { validateUIMessages } from "ai";
import { Array as Arr, Context, Data, Effect, Layer, Option, Schema, pipe } from "effect";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ChatId, type ChatSummary, type ResearchUIMessage } from "../shared/chat.ts";

export interface ChatRecord {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly messages: ReadonlyArray<ResearchUIMessage>;
  readonly activeStreamId: Option.Option<string>;
}

export class ChatNotFound extends Data.TaggedError("ChatNotFound")<{ readonly id: string }> {}

export class ChatStoreError extends Data.TaggedError("ChatStoreError")<{
  readonly id: string;
  readonly cause: unknown;
}> {}

interface ChatStoreApi {
  readonly load: (id: string) => Effect.Effect<ChatRecord, ChatNotFound | ChatStoreError>;
  readonly save: (record: ChatRecord) => Effect.Effect<ChatRecord, ChatStoreError>;
  readonly upsert: (
    id: string,
    patch: (record: ChatRecord) => ChatRecord,
  ) => Effect.Effect<ChatRecord, ChatStoreError>;
  readonly list: Effect.Effect<ReadonlyArray<ChatSummary>, ChatStoreError>;
}

export class ChatStore extends Context.Service<ChatStore, ChatStoreApi>()("ChatStore") {}

export const emptyChat = (id: string): ChatRecord => {
  const now = new Date().toISOString();
  return { id, title: "New chat", createdAt: now, updatedAt: now, messages: [], activeStreamId: Option.none() };
};

export const summarize = (record: ChatRecord): ChatSummary => ({
  id: record.id,
  title: record.title,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  generating: Option.isSome(record.activeStreamId),
});

const TITLE_LENGTH = 40;

export const titleFor = (messages: ReadonlyArray<ResearchUIMessage>): string =>
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

const ChatRow = Schema.Struct({
  id: ChatId,
  title: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
  active_stream_id: Schema.NullOr(Schema.String),
  messages: Schema.fromJsonString(Schema.Array(Schema.Unknown)),
});

const SummaryRow = Schema.Struct({
  id: ChatId,
  title: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
  active_stream_id: Schema.NullOr(Schema.String),
});

export const ChatStoreSqlite = (file: string): Layer.Layer<ChatStore> =>
  Layer.sync(ChatStore, () => {
    mkdirSync(path.dirname(file), { recursive: true });
    const db = new DatabaseSync(file);
    db.exec(`
      create table if not exists chats (
        id text primary key,
        title text not null,
        created_at text not null,
        updated_at text not null,
        active_stream_id text,
        messages text not null
      )
    `);
    const selectChat = db.prepare("select * from chats where id = ?");
    const selectSummaries = db.prepare(
      "select id, title, created_at, updated_at, active_stream_id from chats order by updated_at desc",
    );
    const writeChat = db.prepare(`
      insert into chats (id, title, created_at, updated_at, active_stream_id, messages)
      values (?, ?, ?, ?, ?, ?)
      on conflict(id) do update set
        title = excluded.title,
        updated_at = excluded.updated_at,
        active_stream_id = excluded.active_stream_id,
        messages = excluded.messages
    `);

    const load: ChatStoreApi["load"] = (id) =>
      Effect.gen(function* () {
        yield* Schema.decodeUnknownEffect(ChatId)(id).pipe(
          Effect.mapError(() => new ChatNotFound({ id })),
        );
        const row = yield* Effect.try({
          try: () => selectChat.get(id),
          catch: (cause) => new ChatStoreError({ id, cause }),
        });
        if (row === undefined) return yield* new ChatNotFound({ id });
        const stored = yield* Schema.decodeUnknownEffect(ChatRow)(row).pipe(
          Effect.mapError((cause) => new ChatStoreError({ id, cause })),
        );
        const messages = yield* Effect.tryPromise({
          try: () => validateUIMessages<ResearchUIMessage>({ messages: stored.messages }),
          catch: (cause) => new ChatStoreError({ id, cause }),
        });
        return {
          id: stored.id,
          title: stored.title,
          createdAt: stored.created_at,
          updatedAt: stored.updated_at,
          messages,
          activeStreamId: Option.fromNullOr(stored.active_stream_id),
        };
      });

    const save: ChatStoreApi["save"] = (record) =>
      Effect.try({
        try: () => {
          const saved: ChatRecord = {
            ...record,
            title: titleFor(record.messages),
            updatedAt: new Date().toISOString(),
          };
          writeChat.run(
            saved.id,
            saved.title,
            saved.createdAt,
            saved.updatedAt,
            Option.getOrNull(saved.activeStreamId),
            JSON.stringify(saved.messages),
          );
          return saved;
        },
        catch: (cause) => new ChatStoreError({ id: record.id, cause }),
      });

    const upsert: ChatStoreApi["upsert"] = (id, patch) =>
      load(id).pipe(
        Effect.catchTag("ChatNotFound", () => Effect.succeed(emptyChat(id))),
        Effect.map(patch),
        Effect.flatMap(save),
      );

    const list: ChatStoreApi["list"] = Effect.try({
      try: () => selectSummaries.all(),
      catch: (cause) => new ChatStoreError({ id: "*", cause }),
    }).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(SummaryRow))),
      Effect.mapError((cause) => new ChatStoreError({ id: "*", cause })),
      Effect.map(
        Arr.map((row) => ({
          id: row.id,
          title: row.title,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          generating: row.active_stream_id !== null,
        })),
      ),
    );

    return { load, save, upsert, list };
  });

export const ChatStoreLive: Layer.Layer<ChatStore> = ChatStoreSqlite(".data/chats.sqlite");
