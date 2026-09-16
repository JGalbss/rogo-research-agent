import { useLiveQuery } from "@tanstack/react-db";
import { Array as Arr, HashMap, Match, Option, Order, pipe } from "effect";
import { type ChatId, type ResearchUIMessage, chatTitle } from "@/shared/chat";
import type { ChatEventRecord } from "@/shared/chat-events";
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

export const emptyEntry = (id: ChatId): ChatEntry => ({
  id,
  createdAt: "",
  title: chatTitle([]),
  messages: [],
  generation: Option.none(),
});

const byCreatedAt = Order.mapInput(Order.String, (chat: ChatEntry) => chat.createdAt);

export const deriveChats = (
  events: ReadonlyArray<ChatEventRecord>,
): ReadonlyArray<ChatEntry> =>
  pipe(
    Arr.reduce(events, HashMap.empty<ChatId, ChatEntry>(), (chats, { event }) =>
      Match.value(event).pipe(
        Match.tag("ChatCreated", ({ id, createdAt }) =>
          HashMap.set(chats, id, { ...emptyEntry(id), createdAt }),
        ),
        Match.tag("MessageAppended", ({ chatId, message }) =>
          HashMap.modify(chats, chatId, (chat) => {
            const messages = Arr.append(
              Arr.filter(chat.messages, (existing) => existing.id !== message.id),
              message,
            );
            return { ...chat, messages, title: chatTitle(messages) };
          }),
        ),
        Match.tag("GenerationStarted", ({ chatId, streamId, readUrl }) =>
          HashMap.modify(chats, chatId, (chat) => ({
            ...chat,
            generation: Option.some({ streamId, readUrl }),
          })),
        ),
        Match.tag("GenerationFinished", ({ chatId }) =>
          HashMap.modify(chats, chatId, (chat) => ({ ...chat, generation: Option.none() })),
        ),
        Match.exhaustive,
      ),
    ),
    HashMap.values,
    Arr.fromIterable,
    Arr.sortBy(byCreatedAt),
    Arr.reverse,
  );

export const useChats = (): ReadonlyArray<ChatEntry> => {
  const { data } = useLiveQuery((q) => q.from({ events: sync.collections.events }));
  return deriveChats(data);
};
