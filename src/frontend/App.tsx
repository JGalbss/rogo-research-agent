import { Array as Arr, Option } from "effect";
import { SidebarExpand } from "iconoir-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactElement, useState } from "react";
import { Chat } from "@/frontend/components/chat/Chat";
import PromptBar from "@/frontend/components/primitives/PromptBar";
import SidebarNav from "@/frontend/components/primitives/SidebarNav";
import { chatFor } from "@/frontend/store/chat";
import { type ChatEntry, emptyEntry, useChats } from "@/frontend/store/chats";
import { parseQuestion } from "@/frontend/store/question";
import { selectChat, startNewChat, useSelectedChat } from "@/frontend/store/selection";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ask = (entry: ChatEntry, text: string): void => {
  const chat = chatFor(entry);
  if (chat.status === "submitted" || chat.status === "streaming") return;
  Option.map(parseQuestion(text), (question) => {
    void chat.sendMessage({ text: question });
  });
};

export function App(): ReactElement {
  const chats = useChats();
  const selected = useSelectedChat();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const entry = Option.getOrElse(
    Arr.findFirst(chats, (chat) => chat.id === selected),
    () => emptyEntry(selected),
  );
  const recents = chats.map((chat) => ({ id: chat.id, label: chat.title }));

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <SidebarNav
        fill
        recents={recents}
        activeTitle={entry.title}
        activeId={entry.id}
        onNewChat={startNewChat}
        onPick={selectChat}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {sidebarCollapsed ? (
          <button
            type="button"
            aria-label="Show sidebar"
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-3 left-3 z-10 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-colors duration-150 hover:bg-hover-2 hover:text-ink"
          >
            <SidebarExpand width={18} height={18} />
          </button>
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={entry.id}
            className="flex min-h-0 flex-1 flex-col"
            initial={false}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.16, ease: EASE }}
          >
            <Chat entry={entry} onAsk={(text) => ask(entry, text)} />
          </motion.div>
        </AnimatePresence>
        <div className="mx-auto w-full max-w-[740px] shrink-0 px-6 pt-3 pb-6">
          <PromptBar
            demo={false}
            placeholder="Ask a research question…"
            onSend={(text) => ask(entry, text)}
          />
        </div>
      </main>
    </div>
  );
}
