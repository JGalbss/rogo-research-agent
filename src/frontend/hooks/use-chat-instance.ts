import type { Chat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { chatFor, reseedChat } from "@/frontend/store/chat";
import type { ChatEntry } from "@/frontend/store/chats";
import type { ResearchUIMessage } from "@/shared/chat";

export const useChatInstance = (entry: ChatEntry): Chat<ResearchUIMessage> => {
  const [chat] = useState(() => chatFor(entry));
  useEffect(() => {
    reseedChat(chat, entry);
  }, [chat, entry]);
  return chat;
};
