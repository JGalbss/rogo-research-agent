import { toDurableStreamResponse } from "@durable-streams/aisdk-transport";
import type { DurableStreamTarget } from "@durable-streams/aisdk-transport";
import { DurableStreamTestServer } from "@durable-streams/server";
import { Context, Effect, Layer, MutableHashMap } from "effect";
import type { Option } from "effect";
import { AppConfig } from "./config.ts";

export interface ActiveGeneration {
  readonly readUrl: string;
  readonly interrupt: Effect.Effect<void>;
}

export class DurableStreams extends Context.Service<
  DurableStreams,
  {
    readonly url: string;
    readonly target: (chatId: string, streamId: string) => DurableStreamTarget;
    readonly publish: (
      target: DurableStreamTarget,
      source: AsyncIterable<unknown>,
    ) => Effect.Effect<Response>;
    readonly markActive: (chatId: string, generation: ActiveGeneration) => void;
    readonly clearActive: (chatId: string) => void;
    readonly active: (chatId: string) => Option.Option<ActiveGeneration>;
  }
>()("DurableStreams") {}

export const DurableStreamsLive: Layer.Layer<DurableStreams, never, AppConfig> = Layer.effect(
  DurableStreams,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const server = new DurableStreamTestServer({
      port: config.durableStreamsPort,
      host: "127.0.0.1",
      dataDir: config.durableStreamsDir,
    });

    const url = yield* Effect.acquireRelease(
      Effect.promise(() => server.start()),
      () => Effect.promise(() => server.stop()),
    );
    yield* Effect.logInfo("durable streams", { url });

    const generations = MutableHashMap.empty<string, ActiveGeneration>();

    return {
      url,
      target: (chatId, streamId) => {
        const path = `/chats/${chatId}/${streamId}`;
        return { writeUrl: `${url}${path}`, readUrl: `/streams${path}`, createIfMissing: true };
      },
      publish: (target, source) =>
        Effect.promise(() => toDurableStreamResponse({ source, stream: target })),
      markActive: (chatId, generation) => {
        MutableHashMap.set(generations, chatId, generation);
      },
      clearActive: (chatId) => {
        MutableHashMap.remove(generations, chatId);
      },
      active: (chatId) => MutableHashMap.get(generations, chatId),
    };
  }),
);
