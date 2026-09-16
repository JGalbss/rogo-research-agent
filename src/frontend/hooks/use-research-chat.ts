import { type UseChatHelpers, useChat } from "@ai-sdk/react";
import { Option } from "effect";
import { useEffect, useState } from "react";
import { chatFor, reseedChat, resumeChat } from "@/frontend/store/chat";
import type { ChatEntry } from "@/frontend/store/chats";
import type { ResearchUIMessage } from "@/shared/chat";

export const useResearchChat = (entry: ChatEntry): UseChatHelpers<ResearchUIMessage> => {
  const [chat] = useState(() => chatFor(entry));
  const streamId = Option.getOrUndefined(
    Option.map(entry.generation, (generation) => generation.streamId),
  );
  useEffect(() => {
    reseedChat(chat, entry);
  }, [chat, entry]);
  useEffect(() => {
    if (streamId !== undefined) resumeChat(chat);
  }, [chat, streamId]);
  return useChat({ chat });
};
