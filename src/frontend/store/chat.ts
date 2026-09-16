import { Chat } from "@ai-sdk/react";
import { createDurableChatTransport } from "@durable-streams/aisdk-transport";
import { Array as Arr, MutableHashMap, Option } from "effect";
import type { ChatId, ResearchUIMessage } from "@/shared/chat";
import type { ChatEntry } from "./chats.ts";

const transport = createDurableChatTransport<ResearchUIMessage>({ api: "/api/chat" });
const chats = MutableHashMap.empty<ChatId, Chat<ResearchUIMessage>>();

const dedupe = (messages: ReadonlyArray<ResearchUIMessage>): ResearchUIMessage[] =>
  Arr.dedupeWith(messages, (a, b) => a.id === b.id);

export const chatFor = (entry: ChatEntry): Chat<ResearchUIMessage> =>
  Option.match(MutableHashMap.get(chats, entry.id), {
    onNone: () => {
      const chat = new Chat<ResearchUIMessage>({
        id: entry.id,
        transport,
        messages: dedupe(entry.messages),
      });
      MutableHashMap.set(chats, entry.id, chat);
      return chat;
    },
    onSome: (chat) => {
      if (chat.status !== "ready") return chat;
      if (entry.messages.length <= chat.messages.length) return chat;
      chat.messages = dedupe(entry.messages);
      return chat;
    },
  });
