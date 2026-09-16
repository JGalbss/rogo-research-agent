import { toDurableStreamResponse } from "@durable-streams/aisdk-transport";
import express, { type Request, type Response } from "express";
import { convertToModelMessages, createUIMessageStream, generateId, validateUIMessages } from "ai";
import { Effect, Option } from "effect";
import { AgentEvent } from "../shared/agent-event.ts";
import type { ResearchUIMessage } from "../shared/chat.ts";
import { researcher } from "./agent/research-agent.ts";
import { config } from "./config.ts";
import { activeStream, clearActive, durableStreams, markActive, streamTarget } from "./streams.ts";
import { runtime } from "./utils/runtime.ts";

const app = express();
app.use(express.json());

const logEvent = AgentEvent.$match({
  Iteration: ({ n }) => Effect.logInfo("iteration", { n }),
  ToolStart: ({ name, input }) => Effect.logInfo("tool start", { name, input }),
  ToolEnd: ({ name, ms }) => Effect.logInfo("tool end", { name, ms }),
  ToolFailed: ({ name, message }) => Effect.logWarning("tool failed", { name, message }),
});

app.post("/api/chat", async (req: Request, res: Response) => {
  const chatId = String(req.body.id ?? "research");
  const messages = await validateUIMessages<ResearchUIMessage>({ messages: req.body.messages });
  runtime.runSync(Effect.logInfo("chat", { chatId, messages: messages.length }));

  const stream = createUIMessageStream<ResearchUIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const result = await researcher.stream(await convertToModelMessages(messages), (event) => {
        runtime.runSync(logEvent(event));
        writer.write({ type: "data-agent-event", data: event });
      });
      writer.merge(result.toUIMessageStream({ sendReasoning: true, sendSources: true }));
    },
    onFinish: () => clearActive(chatId),
    onError: (error) => {
      runtime.runSync(Effect.logError("chat failed", error));
      return String(error);
    },
  });

  const target = streamTarget(chatId, generateId());
  markActive(chatId, String(target.readUrl));
  const pointer = await toDurableStreamResponse({ source: stream, stream: target });
  pointer.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(pointer.status).send(await pointer.text());
});

app.get("/api/chat/:id/stream", (req: Request, res: Response) => {
  Option.match(activeStream(String(req.params.id)), {
    onNone: () => res.sendStatus(204),
    onSome: (streamUrl) => res.status(200).location(streamUrl).json({ streamUrl }),
  });
});

const boot = Effect.gen(function* () {
  const streamsUrl = yield* Effect.promise(() => durableStreams.start());
  yield* Effect.logInfo("durable streams", { url: streamsUrl });
  app.listen(config.port, () => {
    runtime.runSync(Effect.logInfo("listening", { url: `http://localhost:${config.port}` }));
  });
});

runtime.runPromise(boot);
