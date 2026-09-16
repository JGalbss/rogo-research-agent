import { DurableStream } from "@durable-streams/client";
import { generateId } from "ai";
import { Context, Data, DateTime, Effect, Layer } from "effect";
import { CHATS_STREAM_PATH, type ChatEvent, chatEventsState } from "../shared/chat-events.ts";

export class ChatIndexError extends Data.TaggedError("ChatIndexError")<{ readonly cause: unknown }> {}

interface ChatIndexApi {
  readonly emit: (event: ChatEvent) => Effect.Effect<void, ChatIndexError>;
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
      const emit: ChatIndexApi["emit"] = (event) =>
        DateTime.now.pipe(
          Effect.flatMap((now) =>
            Effect.tryPromise({
              try: () =>
                stream.append(
                  JSON.stringify(
                    chatEventsState.events.insert({
                      value: { id: generateId(), at: DateTime.formatIso(now), event },
                    }),
                  ),
                ),
              catch: (cause) => new ChatIndexError({ cause }),
            }),
          ),
        );
      return { emit };
    }),
  );
