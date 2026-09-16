import { DurableStream } from "@durable-streams/client";
import { Context, Data, Effect, Layer } from "effect";
import { CHATS_STREAM_PATH, type ChatSummary, chatsState } from "../shared/chat.ts";

export class ChatIndexError extends Data.TaggedError("ChatIndexError")<{ readonly cause: unknown }> {}

interface ChatIndexApi {
  readonly publish: (summary: ChatSummary) => Effect.Effect<void, ChatIndexError>;
}

export class ChatIndex extends Context.Service<ChatIndex, ChatIndexApi>()("ChatIndex") {}

export const ChatIndexAt = (streamsUrl: string): Layer.Layer<ChatIndex> =>
  Layer.effect(
    ChatIndex,
    Effect.gen(function* () {
      const options = {
        url: `${streamsUrl}${CHATS_STREAM_PATH}`,
        headers: { "content-type": "application/json" },
      };
      const stream = yield* Effect.promise(() =>
        DurableStream.create(options).catch(() => new DurableStream(options)),
      );
      const publish: ChatIndexApi["publish"] = (summary) =>
        Effect.tryPromise({
          try: () => stream.append(JSON.stringify(chatsState.chats.upsert({ value: summary }))),
          catch: (cause) => new ChatIndexError({ cause }),
        });
      return { publish };
    }),
  );
