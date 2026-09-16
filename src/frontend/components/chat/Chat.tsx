import { useChat } from "@ai-sdk/react";
import { Array as Arr, Option } from "effect";
import { AnimatePresence, motion } from "motion/react";
import { type ReactElement, useEffect, useRef, useState } from "react";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import { chatFor } from "@/frontend/store/chat";
import type { ChatEntry } from "@/frontend/store/chats";
import { AnimatedMessage } from "./AnimatedMessage.tsx";
import { ChatView, acceptsInput, classifyChatView } from "./chat-view.ts";
import { ExamplePrompts } from "./ExamplePrompts.tsx";
import { MessageBubble } from "./MessageBubble.tsx";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function Chat({
  entry,
  onAsk,
}: {
  entry: ChatEntry;
  onAsk: (text: string) => void;
}): ReactElement {
  const chat = chatFor(entry);
  const [resume] = useState(() => Option.isSome(entry.generation) && chat.status === "ready");
  const { messages, status, error } = useChat({ chat, resume });
  const view = classifyChatView({
    status,
    messageCount: messages.length,
    error,
    stored: entry.createdAt.length > 0,
  });
  const settled = acceptsInput(view);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openedWith] = useState(() => messages.length);
  const followed = useRef(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (node === null) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (followed.current && distance > 120) return;
    node.scrollTop = node.scrollHeight;
    followed.current = true;
  }, [messages, status]);

  const awaitingReply = Option.exists(Arr.last(messages), (message) => message.role === "user");
  const statusSlot = ChatView.$match(view, {
    Empty: () => null,
    Loading: () => null,
    Idle: () => null,
    Streaming: () => (awaitingReply ? <ThinkingState variant="Coding" rows={[]} active="Thinking" working /> : null),
    Submitted: () => <ThinkingState variant="Coding" rows={[]} active="Thinking" working />,
    Failed: ({ message }) => (
      <p className="text-[13px] text-red">Something went wrong: {message}</p>
    ),
  });

  return (
    <div
      ref={scrollRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto [scrollbar-color:var(--line-strong)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
    >
      <AnimatePresence>
        {ChatView.$is("Empty")(view) ? (
          <motion.div
            key="greeting"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 pb-24 text-center"
            initial={false}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
              What are we researching?
            </h1>
            <ExamplePrompts onPick={onAsk} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto flex w-full max-w-[740px] flex-col gap-6 px-6 pt-10 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <AnimatedMessage key={message.id} index={index} waterfall={index < openedWith}>
              <MessageBubble message={message} settled={settled} />
            </AnimatedMessage>
          ))}
          <div key="status" className="min-h-8">
            {statusSlot}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
