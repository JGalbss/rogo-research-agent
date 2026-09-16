import { Chat } from "@ai-sdk/react";
import { createDurableChatTransport } from "@durable-streams/aisdk-transport";
import { MutableHashMap, Option } from "effect";
import type { ChatId, ResearchUIMessage } from "@/shared/chat";

const transport = createDurableChatTransport<ResearchUIMessage>({ api: "/api/chat" });
const chats = MutableHashMap.empty<ChatId, Chat<ResearchUIMessage>>();

export const chatFor = (
  id: ChatId,
  messages: ReadonlyArray<ResearchUIMessage>,
): Chat<ResearchUIMessage> =>
  Option.getOrElse(MutableHashMap.get(chats, id), () => {
    const chat = new Chat<ResearchUIMessage>({ id, transport, messages: Array.from(messages) });
    MutableHashMap.set(chats, id, chat);
    return chat;
  });
