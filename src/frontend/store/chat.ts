import { Chat } from "@ai-sdk/react";
import { createDurableChatTransport } from "@durable-streams/aisdk-transport";
import type { ResearchUIMessage } from "@/shared/chat";

export const chat = new Chat<ResearchUIMessage>({
  id: "research",
  transport: createDurableChatTransport<ResearchUIMessage>({ api: "/api/chat" }),
});
