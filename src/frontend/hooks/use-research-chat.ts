import { type UseChatHelpers, useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { openChat, reseedChat } from "@/frontend/store/chat";
import type { ChatEntry } from "@/frontend/store/chats";
import type { ResearchUIMessage } from "@/shared/chat";

export const useResearchChat = (entry: ChatEntry): UseChatHelpers<ResearchUIMessage> => {
  const [session] = useState(() => openChat(entry));
  useEffect(() => {
    reseedChat(session.chat, entry);
  }, [session, entry]);
  return useChat(session);
};
