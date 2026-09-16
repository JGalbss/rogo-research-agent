import { Effect, Layer, ManagedRuntime } from "effect";
import { ResearcherLive } from "../agent/research-agent.ts";
import { ChatIndexAt } from "../chat-index.ts";
import { ChatStoreLive } from "../chat-store.ts";
import { AppConfigLive } from "../config.ts";
import { DurableStreams, DurableStreamsLive } from "../streams.ts";
import { LoggerLive } from "./logger.ts";

const ChatIndexLive = Layer.unwrap(
  Effect.gen(function* () {
    const streams = yield* DurableStreams;
    return ChatIndexAt(streams.url);
  }),
);

const AppLive = Layer.mergeAll(ResearcherLive, ChatStoreLive).pipe(
  Layer.provideMerge(ChatIndexLive),
  Layer.provideMerge(DurableStreamsLive),
  Layer.provideMerge(AppConfigLive),
  Layer.provideMerge(LoggerLive),
);

export const runtime = ManagedRuntime.make(AppLive);
