import { SidebarExpand } from "iconoir-react";
import { type ReactElement, useState } from "react";
import { Chat } from "@/frontend/components/chat/Chat";
import PromptBar from "@/frontend/components/primitives/PromptBar";
import SidebarNav from "@/frontend/components/primitives/SidebarNav";
import { useSelectedChat } from "@/frontend/hooks/use-selected-chat";
import { askChat } from "@/frontend/store/chat";
import { useChats } from "@/frontend/store/chats";

export function App(): ReactElement {
  const chats = useChats();
  const { selected, select, startNew } = useSelectedChat();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const recents = chats.map((chat) => ({ id: chat.id, label: chat.title }));

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <SidebarNav
        fill
        recents={recents}
        activeTitle={null}
        activeId={selected}
        onNewChat={startNew}
        onPick={select}
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
        <Chat key={selected} id={selected} onAsk={(text) => askChat(selected, text)} />
        <div className="relative mx-auto w-full max-w-[740px] shrink-0 px-6 pt-3 pb-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-14 h-14"
            style={{ background: "linear-gradient(to top, var(--page) 20%, transparent)" }}
          />
          <PromptBar
            demo={false}
            placeholder="Ask a research question…"
            onSend={(text) => askChat(selected, text)}
          />
        </div>
      </main>
    </div>
  );
}
