import { generateId } from "ai";
import { MutableHashSet, MutableRef } from "effect";
import { useSyncExternalStore } from "react";
import type { ChatId } from "@/shared/chat";
import { loadChat } from "./snapshot.ts";

const selected = MutableRef.make<ChatId>(generateId());
const listeners = MutableHashSet.empty<() => void>();

export const selectChat = (id: ChatId): void => {
  MutableRef.set(selected, id);
  void loadChat(id);
  for (const listener of listeners) listener();
};

export const startNewChat = (): void => selectChat(generateId());

export const useSelectedChat = (): ChatId =>
  useSyncExternalStore(
    (listener) => {
      MutableHashSet.add(listeners, listener);
      return () => {
        MutableHashSet.remove(listeners, listener);
      };
    },
    () => MutableRef.get(selected),
  );
