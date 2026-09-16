import { Chat } from "@ai-sdk/react";
import { createDurableChatTransport } from "@durable-streams/aisdk-transport";
import { Array as Arr, MutableHashMap, Option, Schema } from "effect";
import type { ChatId, ResearchUIMessage } from "@/shared/chat";
import type { ChatEntry } from "./chats.ts";

const transport = createDurableChatTransport<ResearchUIMessage>({ api: "/api/chat" });
const chats = MutableHashMap.empty<ChatId, Chat<ResearchUIMessage>>();
const Question = Schema.NonEmptyString;

const dedupe = (messages: ReadonlyArray<ResearchUIMessage>): ResearchUIMessage[] =>
  Arr.dedupeWith(messages, (a, b) => a.id === b.id);

const sameSequence = Arr.makeEquivalence<ResearchUIMessage>((a, b) => a.id === b.id);

export const chatFor = (entry: ChatEntry): Chat<ResearchUIMessage> =>
  Option.getOrElse(MutableHashMap.get(chats, entry.id), () => {
    const chat = new Chat<ResearchUIMessage>({
      id: entry.id,
      transport,
      messages: dedupe(entry.messages),
    });
    MutableHashMap.set(chats, entry.id, chat);
    return chat;
  });

export const reseedChat = (chat: Chat<ResearchUIMessage>, entry: ChatEntry): void => {
  if (chat.status !== "ready") return;
  if (entry.messages.length < chat.messages.length) return;
  const next = dedupe(entry.messages);
  if (sameSequence(next, chat.messages)) return;
  chat.messages = next;
};

export const resumeChat = (chat: Chat<ResearchUIMessage>): void => {
  if (chat.status !== "ready") return;
  void chat.resumeStream();
};

export const askChat = (entry: ChatEntry, text: string): void => {
  const chat = chatFor(entry);
  if (chat.status === "submitted" || chat.status === "streaming") return;
  const question = Schema.decodeUnknownOption(Question)(text.trim());
  if (Option.isNone(question)) return;
  void chat.sendMessage({ text: question.value });
};
