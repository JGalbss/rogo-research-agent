import { createCollection, localOnlyCollectionOptions } from "@tanstack/db";
import { Effect, MutableHashSet, Schema } from "effect";
import { Chat, type ChatId, ChatSummary } from "@/shared/chat";

export const chatSummaries = createCollection(
  localOnlyCollectionOptions({
    id: "chat-summaries",
    getKey: (summary: ChatSummary) => summary.id,
  }),
);

export const chatSnapshots = createCollection(
  localOnlyCollectionOptions({
    id: "chat-snapshots",
    getKey: (chat: Chat) => chat.id,
  }),
);

const fetchJson = (url: string) =>
  Effect.promise(() => fetch(url)).pipe(
    Effect.filterOrFail(
      (response) => response.ok,
      (response) => new Error(`${url} answered ${response.status}`),
    ),
    Effect.flatMap((response) => Effect.promise(() => response.json())),
  );

export const loadChatSummaries: Promise<void> = Effect.runPromise(
  fetchJson("/api/chats").pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ChatSummary))),
    Effect.map((summaries) => {
      summaries
        .filter((summary) => !chatSummaries.has(summary.id))
        .forEach((summary) => chatSummaries.insert(summary));
    }),
    Effect.catch(() => Effect.logWarning("chat list did not load")),
  ),
);

const requested = MutableHashSet.empty<ChatId>();

export const loadChat = (id: ChatId): Promise<void> => {
  if (MutableHashSet.has(requested, id)) return Promise.resolve();
  MutableHashSet.add(requested, id);
  return Effect.runPromise(
    fetchJson(`/api/chat/${id}`).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Chat)),
      Effect.map((chat) => {
        if (chatSnapshots.has(chat.id)) return;
        chatSnapshots.insert(chat);
      }),
      Effect.catch(() => Effect.void),
    ),
  );
};
