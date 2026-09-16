import { useLiveQuery } from "@tanstack/react-db";
import { Array as Arr, HashMap, Match, Option, Order, pipe } from "effect";
import {
  type Chat,
  type ChatId,
  type ChatSummary,
  type ResearchUIMessage,
  chatTitle,
} from "@/shared/chat";
import type { ChatEventRecord } from "@/shared/chat-events";
import { chatSnapshots, chatSummaries } from "./snapshot.ts";
import { sync } from "./sync.ts";

export interface Generation {
  readonly streamId: string;
  readonly readUrl: string;
}

export interface ChatEntry {
  readonly id: ChatId;
  readonly createdAt: string;
  readonly title: string;
  readonly messages: ReadonlyArray<ResearchUIMessage>;
  readonly generation: Option.Option<Generation>;
}

type Chats = HashMap.HashMap<ChatId, ChatEntry>;

export const emptyEntry = (id: ChatId): ChatEntry => ({
  id,
  createdAt: "",
  title: chatTitle([]),
  messages: [],
  generation: Option.none(),
});

const upsert = (chats: Chats, id: ChatId, change: (chat: ChatEntry) => ChatEntry): Chats =>
  HashMap.set(
    chats,
    id,
    change(Option.getOrElse(HashMap.get(chats, id), () => emptyEntry(id))),
  );

const byCreatedAt = Order.mapInput(Order.String, (chat: ChatEntry) => chat.createdAt);
const byEventTime = Order.mapInput(Order.String, (record: ChatEventRecord) => record.at);

export const deriveChats = (source: {
  readonly summaries: ReadonlyArray<ChatSummary>;
  readonly snapshots: ReadonlyArray<Chat>;
  readonly events: ReadonlyArray<ChatEventRecord>;
}): ReadonlyArray<ChatEntry> => {
  const fromSummaries = Arr.reduce(
    source.summaries,
    HashMap.empty<ChatId, ChatEntry>(),
    (chats, summary) =>
      upsert(chats, summary.id, (chat) => ({
        ...chat,
        createdAt: summary.createdAt,
        title: summary.title,
      })),
  );
  const fromSnapshots = Arr.reduce(source.snapshots, fromSummaries, (chats, snapshot) =>
    upsert(chats, snapshot.id, (chat) => ({
      ...chat,
      createdAt: snapshot.createdAt,
      messages: snapshot.messages,
      title: chatTitle(snapshot.messages),
    })),
  );
  const fromEvents = Arr.reduce(Arr.sort(source.events, byEventTime), fromSnapshots, (chats, { event }) =>
    Match.value(event).pipe(
      Match.tag("ChatCreated", ({ id, createdAt }) =>
        upsert(chats, id, (chat) => ({ ...chat, createdAt })),
      ),
      Match.tag("MessageAppended", ({ chatId, message }) =>
        upsert(chats, chatId, (chat) => {
          const messages = Option.match(
            Arr.findFirstIndex(chat.messages, (existing) => existing.id === message.id),
            {
              onNone: () => Arr.append(chat.messages, message),
              onSome: () =>
                Arr.map(chat.messages, (existing) => {
                  if (existing.id === message.id) return message;
                  return existing;
                }),
            },
          );
          return { ...chat, messages, title: chatTitle(messages) };
        }),
      ),
      Match.tag("GenerationStarted", ({ chatId, streamId, readUrl }) =>
        upsert(chats, chatId, (chat) => ({
          ...chat,
          generation: Option.some({ streamId, readUrl }),
        })),
      ),
      Match.tag("GenerationFinished", ({ chatId }) =>
        upsert(chats, chatId, (chat) => ({ ...chat, generation: Option.none() })),
      ),
      Match.exhaustive,
    ),
  );

  return pipe(HashMap.values(fromEvents), Arr.fromIterable, Arr.sortBy(byCreatedAt), Arr.reverse);
};

export const useChats = (): ReadonlyArray<ChatEntry> => {
  const summaries = useLiveQuery((q) => q.from({ summaries: chatSummaries }));
  const snapshots = useLiveQuery((q) => q.from({ snapshots: chatSnapshots }));
  const events = useLiveQuery((q) => q.from({ events: sync.collections.events }));
  return deriveChats({
    summaries: summaries.data,
    snapshots: snapshots.data,
    events: events.data,
  });
};
