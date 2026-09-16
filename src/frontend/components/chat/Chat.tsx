import { useChat } from "@ai-sdk/react";
import { Array as Arr, Option } from "effect";
import { AnimatePresence, motion } from "motion/react";
import { type ReactElement, useEffect, useRef, useState } from "react";
import LoadingState from "@/frontend/components/primitives/LoadingState";
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
  const view = classifyChatView({ status, messageCount: messages.length, error });
  const settled = acceptsInput(view);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settledOnce = useRef(false);

  useEffect(() => {
    const node = scrollRef.current;
    if (node === null) return;
    node.scrollTo({ top: node.scrollHeight, behavior: settledOnce.current ? "smooth" : "instant" });
    settledOnce.current = true;
  }, [messages, status]);

  const awaitingReply = Option.exists(Arr.last(messages), (message) => message.role === "user");
  const statusSlot = ChatView.$match(view, {
    Empty: () => null,
    Idle: () => null,
    Streaming: () => (awaitingReply ? <LoadingState label="Researching" /> : null),
    Submitted: () => <LoadingState label="Researching" />,
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
            <AnimatedMessage key={message.id} index={index}>
              <MessageBubble message={message} settled={settled} />
            </AnimatedMessage>
          ))}
          <motion.div
            key={view._tag}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {statusSlot}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
