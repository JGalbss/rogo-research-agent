import { useChat } from "@ai-sdk/react";
import type { ReactElement } from "react";
import LoadingState from "@/frontend/components/primitives/LoadingState";
import PromptBar from "@/frontend/components/primitives/PromptBar";
import { chat } from "@/frontend/store/chat";
import { ChatView, acceptsInput, classifyChatView } from "./chat-view.ts";
import { ExamplePrompts } from "./ExamplePrompts.tsx";
import { MessageBubble } from "./MessageBubble.tsx";

export function Chat(): ReactElement {
  const { messages, sendMessage, status, error } = useChat({ chat });
  const view = classifyChatView({ status, messageCount: messages.length, error });
  const settled = acceptsInput(view);

  const send = (text: string) => {
    const question = text.trim();
    if (question.length === 0 || !settled) return;
    void sendMessage({ text: question });
  };

  const viewSlot = ChatView.$match(view, {
    Empty: () => <ExamplePrompts onPick={send} />,
    Idle: () => null,
    Streaming: () => null,
    Submitted: () => <LoadingState label="Researching" />,
    Failed: ({ message }) => (
      <p className="text-[13px] text-red">Something went wrong: {message}</p>
    ),
  });

  return (
    <>
      <div className="flex flex-1 flex-col gap-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} settled={settled} />
        ))}
        {viewSlot}
      </div>
      <div className="sticky bottom-0 bg-page pt-2">
        <PromptBar demo={false} placeholder="Ask a research question…" onSend={send} />
      </div>
    </>
  );
}
