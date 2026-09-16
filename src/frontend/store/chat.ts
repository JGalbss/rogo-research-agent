import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { ResearchUIMessage } from "@/shared/chat";

export const chat = new Chat<ResearchUIMessage>({
  transport: new DefaultChatTransport({ api: "/api/chat" }),
});
