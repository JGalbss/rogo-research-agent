import { type UseChatHelpers, useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { chatFor, openChat } from "@/frontend/store/chat";
import { refreshChats } from "@/frontend/store/chats";
import type { ChatId, ResearchUIMessage } from "@/shared/chat";

export interface ResearchChat extends UseChatHelpers<ResearchUIMessage> {
  readonly loaded: boolean;
}

export const useResearchChat = (id: ChatId): ResearchChat => {
  const [chat] = useState(() => chatFor(id));
  const [loaded, setLoaded] = useState(false);
  const helpers = useChat({ chat });

  useEffect(() => {
    void openChat(chat).then(() => setLoaded(true));
  }, [chat]);

  useEffect(() => {
    if (helpers.status === "streaming") void refreshChats();
  }, [helpers.status]);

  return { ...helpers, loaded };
};
