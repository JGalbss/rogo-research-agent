import { ManagedRuntime } from "effect";
import { LoggerLive } from "./logger.ts";

export const runtime = ManagedRuntime.make(LoggerLive);
