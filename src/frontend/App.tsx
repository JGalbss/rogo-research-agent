import { generateId } from "ai";
import { Array as Arr, Option } from "effect";
import { AnimatePresence, motion } from "motion/react";
import { type ReactElement, useState } from "react";
import { Chat } from "@/frontend/components/chat/Chat";
import SidebarNav from "@/frontend/components/primitives/SidebarNav";
import { emptyEntry, useChats } from "@/frontend/store/chats";
import type { ChatId } from "@/shared/chat";

export function App(): ReactElement {
  const chats = useChats();
  const [selected, setSelected] = useState<ChatId>(generateId);
  const entry = Option.getOrElse(
    Arr.findFirst(chats, (chat) => chat.id === selected),
    () => emptyEntry(selected),
  );
  const recents = chats.map((chat) => ({ id: chat.id, label: chat.title }));

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        fill
        recents={recents}
        activeTitle={entry.title}
        footerLabel="Rogo Research"
        onNewChat={() => setSelected(generateId())}
        onPick={(id) => setSelected(id)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 px-5 pt-8 pb-6">
        <header>
          <h1 className="text-[20px] font-semibold text-ink">Rogo Research</h1>
          <p className="text-[14px] text-ink-2">
            Ask a question about a company in our coverage universe.
          </p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={entry.id}
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Chat entry={entry} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
