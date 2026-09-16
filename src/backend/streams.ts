import type { DurableStreamTarget } from "@durable-streams/aisdk-transport";
import { DurableStreamTestServer } from "@durable-streams/server";
import { MutableHashMap, type Option } from "effect";
import { config } from "./config.ts";

export const durableStreams = new DurableStreamTestServer({
  port: config.durableStreamsPort,
  host: "127.0.0.1",
});

const activeStreams = MutableHashMap.empty<string, string>();

export const streamTarget = (chatId: string, streamId: string): DurableStreamTarget => {
  const path = `/chats/${chatId}/${streamId}`;
  return {
    writeUrl: `${durableStreams.url}${path}`,
    readUrl: `/streams${path}`,
    createIfMissing: true,
  };
};

export const markActive = (chatId: string, readUrl: string): void => {
  MutableHashMap.set(activeStreams, chatId, readUrl);
};

export const clearActive = (chatId: string): void => {
  MutableHashMap.remove(activeStreams, chatId);
};

export const activeStream = (chatId: string): Option.Option<string> =>
  MutableHashMap.get(activeStreams, chatId);
