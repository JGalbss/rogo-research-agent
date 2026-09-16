import { Layer, ManagedRuntime } from "effect";
import { ResearcherLive } from "../agent/research-agent.ts";
import { ChatStoreLive } from "../chat.service.ts";
import { AppConfigLive } from "../config.ts";
import { DurableStreamsLive } from "../streams.ts";
import { LoggerLive } from "./logger.ts";

const AppLive = Layer.mergeAll(ResearcherLive, ChatStoreLive, DurableStreamsLive).pipe(
  Layer.provideMerge(AppConfigLive),
  Layer.provideMerge(LoggerLive),
);

export const runtime = ManagedRuntime.make(AppLive);
