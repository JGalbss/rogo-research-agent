import { Array as Arr, Option } from "effect";
import { AnimatePresence, motion } from "motion/react";
import { type ReactElement, useRef } from "react";
import { useFollowBottom } from "@/frontend/hooks/use-follow-bottom";
import { useResearchChat } from "@/frontend/hooks/use-research-chat";
import type { ChatId } from "@/shared/chat";
import { classifyChatView, viewTraits } from "./chat-view.tsx";
import { ExamplePrompts } from "./ExamplePrompts.tsx";
import { MessageBubble } from "./MessageBubble.tsx";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function Chat({
  id,
  onAsk,
}: {
  id: ChatId;
  onAsk: (text: string) => void;
}): ReactElement {
  const { messages, status, error, loaded } = useResearchChat(id);
  const traits = viewTraits(
    classifyChatView({
      status,
      messageCount: messages.length,
      lastRole: Option.map(Arr.last(messages), (message) => message.role),
      error,
      loaded,
    }),
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  useFollowBottom(scrollRef, [messages, status]);

  return (
    <div
      ref={scrollRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto [scrollbar-color:var(--line-strong)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
    >
      <AnimatePresence>
        {traits.greeting ? (
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
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            turn={
              traits.liveTurn && index === messages.length - 1
                ? "live"
                : "settled"
            }
          />
        ))}
        <div className="min-h-8">{traits.indicator}</div>
      </div>
    </div>
  );
}
