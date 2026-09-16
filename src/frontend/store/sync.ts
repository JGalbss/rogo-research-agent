import { createStreamDB } from "@durable-streams/state/db";
import { CHATS_STREAM_PATH, chatEventsState } from "@/shared/chat-events";

export const sync = createStreamDB({
  streamOptions: {
    url: new URL(`/streams${CHATS_STREAM_PATH}`, window.location.origin).toString(),
    contentType: "application/json",
  },
  live: "sse",
  state: chatEventsState,
});

export const syncReady: Promise<void> = sync.preload().catch(console.error);
