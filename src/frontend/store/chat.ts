import { Chat } from "@ai-sdk/react";
import { createDurableChatTransport } from "@durable-streams/aisdk-transport";
import { Effect, MutableHashMap, Option, Schema } from "effect";
import { fetchJson } from "@/frontend/utils/fetch-json";
import { type ChatId, type ResearchUIMessage, Chat as StoredChat } from "@/shared/chat";

const transport = createDurableChatTransport<ResearchUIMessage>({ api: "/api/chat" });
const chats = MutableHashMap.empty<ChatId, Chat<ResearchUIMessage>>();
const Question = Schema.NonEmptyString;

export const chatFor = (id: ChatId): Chat<ResearchUIMessage> =>
  Option.getOrElse(MutableHashMap.get(chats, id), () => {
    const chat = new Chat<ResearchUIMessage>({ id, transport });
    MutableHashMap.set(chats, id, chat);
    return chat;
  });

export const openChat = (chat: Chat<ResearchUIMessage>): Promise<void> =>
  Effect.runPromise(
    fetchJson(`/api/chat/${chat.id}`).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(StoredChat)),
      Effect.option,
      Effect.map((stored) => {
        if (chat.status !== "ready") return;
        if (Option.isSome(stored)) chat.messages = [...stored.value.messages];
        void chat.resumeStream();
      }),
    ),
  );

export const askChat = (id: ChatId, text: string): void => {
  const chat = chatFor(id);
  if (chat.status === "submitted" || chat.status === "streaming") return;
  const question = Schema.decodeUnknownOption(Question)(text.trim());
  if (Option.isNone(question)) return;
  void chat.sendMessage({ text: question.value });
};
