import { Effect, MutableHashSet, MutableRef, Schema } from "effect";
import { useEffect, useSyncExternalStore } from "react";
import { fetchJson } from "@/frontend/utils/fetch-json";
import { ChatSummary } from "@/shared/chat";

const summaries = MutableRef.make<ReadonlyArray<ChatSummary>>([]);
const listeners = MutableHashSet.empty<() => void>();

export const refreshChats = (): Promise<void> =>
  Effect.runPromise(
    fetchJson("/api/chats").pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ChatSummary))),
      Effect.map((next) => {
        MutableRef.set(summaries, next);
        for (const listener of listeners) listener();
      }),
      Effect.catch(() => Effect.logWarning("chat list did not load")),
    ),
  );

export const useChats = (): ReadonlyArray<ChatSummary> => {
  useEffect(() => {
    void refreshChats();
  }, []);
  return useSyncExternalStore(
    (listener) => {
      MutableHashSet.add(listeners, listener);
      return () => {
        MutableHashSet.remove(listeners, listener);
      };
    },
    () => MutableRef.get(summaries),
  );
};
