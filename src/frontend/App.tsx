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
    <div className="flex min-h-screen bg-page">
      <SidebarNav
        fill
        recents={recents}
        activeTitle={entry.title}
        footerLabel="Rogo Research"
        onNewChat={() => setSelected(generateId())}
        onPick={(id) => setSelected(id)}
      />
      <main className="mx-auto flex min-h-screen w-full max-w-[740px] flex-col px-6">

        <AnimatePresence mode="wait">
          <motion.div
            key={entry.id}
            className="flex min-h-0 flex-1 flex-col"
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
