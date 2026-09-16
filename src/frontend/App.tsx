import type { ReactElement } from "react";
import { Chat } from "@/frontend/components/chat/Chat";

export function App(): ReactElement {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 px-5 pt-8 pb-6">
      <header>
        <h1 className="text-[20px] font-semibold text-ink">Rogo Research</h1>
        <p className="text-[14px] text-ink-2">
          Ask a question about a company in our coverage universe.
        </p>
      </header>
      <Chat />
    </div>
  );
}
