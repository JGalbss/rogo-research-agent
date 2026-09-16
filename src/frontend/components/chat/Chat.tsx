import { useChat } from "@ai-sdk/react";
import { Option } from "effect";
import { AnimatePresence, motion } from "motion/react";
import type { ReactElement } from "react";
import LoadingState from "@/frontend/components/primitives/LoadingState";
import PromptBar from "@/frontend/components/primitives/PromptBar";
import { chatFor } from "@/frontend/store/chat";
import type { ChatEntry } from "@/frontend/store/chats";
import { parseQuestion } from "@/frontend/store/question";
import { ChatView, acceptsInput, classifyChatView } from "./chat-view.ts";
import { ExamplePrompts } from "./ExamplePrompts.tsx";
import { MessageBubble } from "./MessageBubble.tsx";

const enter = { opacity: 0, y: 8 };
const shown = { opacity: 1, y: 0 };
const leave = { opacity: 0 };

export function Chat({ entry }: { entry: ChatEntry }): ReactElement {
  const { messages, sendMessage, status, error } = useChat({
    chat: chatFor(entry.id, entry.messages),
    resume: true,
  });
  const view = classifyChatView({ status, messageCount: messages.length, error });
  const settled = acceptsInput(view);

  const send = (text: string) => {
    if (!settled) return;
    const question = parseQuestion(text);
    if (Option.isNone(question)) return;
    void sendMessage({ text: question.value });
  };

  const viewSlot = ChatView.$match(view, {
    Empty: () => (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-24 text-center">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">What are we researching?</h1>
        <ExamplePrompts onPick={send} />
      </div>
    ),
    Idle: () => null,
    Streaming: () => null,
    Submitted: () => <LoadingState label="Researching" />,
    Failed: ({ message }) => (
      <p className="text-[13px] text-red">Something went wrong: {message}</p>
    ),
  });

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-10">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout
              initial={enter}
              animate={shown}
              exit={leave}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble message={message} settled={settled} />
            </motion.div>
          ))}
          <motion.div
            key={view._tag}
            className="flex flex-1 flex-col"
            initial={enter}
            animate={shown}
            exit={leave}
            transition={{ duration: 0.2 }}
          >
            {viewSlot}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="sticky bottom-0 bg-page pt-3 pb-6">
        <PromptBar demo={false} placeholder="Ask a research question…" onSend={send} />
      </div>
    </>
  );
}
