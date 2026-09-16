import { toDurableStreamResponse } from "@durable-streams/aisdk-transport";
import type { DurableStreamTarget } from "@durable-streams/aisdk-transport";
import { DurableStreamTestServer } from "@durable-streams/server";
import { Context, Effect, Layer, MutableHashMap } from "effect";
import type { Option } from "effect";
import { AppConfig } from "./config.ts";

export class DurableStreams extends Context.Service<
  DurableStreams,
  {
    readonly url: string;
    readonly target: (chatId: string, streamId: string) => DurableStreamTarget;
    readonly publish: (
      target: DurableStreamTarget,
      source: AsyncIterable<unknown>,
    ) => Effect.Effect<Response>;
    readonly markActive: (chatId: string, readUrl: string) => void;
    readonly clearActive: (chatId: string) => void;
    readonly activeStream: (chatId: string) => Option.Option<string>;
  }
>()("DurableStreams") {}

export const DurableStreamsLive: Layer.Layer<DurableStreams, never, AppConfig> = Layer.effect(
  DurableStreams,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const server = new DurableStreamTestServer({
      port: config.durableStreamsPort,
      host: "127.0.0.1",
    });

    const url = yield* Effect.acquireRelease(
      Effect.promise(() => server.start()),
      () => Effect.promise(() => server.stop()),
    );
    yield* Effect.logInfo("durable streams", { url });

    const activeStreams = MutableHashMap.empty<string, string>();

    return {
      url,
      target: (chatId, streamId) => {
        const path = `/chats/${chatId}/${streamId}`;
        return { writeUrl: `${url}${path}`, readUrl: `/streams${path}`, createIfMissing: true };
      },
      publish: (target, source) =>
        Effect.promise(() => toDurableStreamResponse({ source, stream: target })),
      markActive: (chatId, readUrl) => {
        MutableHashMap.set(activeStreams, chatId, readUrl);
      },
      clearActive: (chatId) => {
        MutableHashMap.remove(activeStreams, chatId);
      },
      activeStream: (chatId) => MutableHashMap.get(activeStreams, chatId),
    };
  }),
);
