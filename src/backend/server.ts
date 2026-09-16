import express, { type Request, type Response } from "express";
import {
  convertToModelMessages,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  validateUIMessages,
} from "ai";
import { Effect } from "effect";
import type { ResearchUIMessage } from "../shared/chat.ts";
import { AgentEvent } from "../shared/agent-event.ts";
import { researcher } from "./agent/research-agent.ts";
import { config } from "./config.ts";
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
  const messages = await validateUIMessages<ResearchUIMessage>({ messages: req.body.messages });
  runtime.runSync(Effect.logInfo("chat", { messages: messages.length }));

  const stream = createUIMessageStream<ResearchUIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const result = await researcher.stream(await convertToModelMessages(messages), (event) => {
        runtime.runSync(logEvent(event));
        writer.write({ type: "data-agent-event", data: event });
      });
      writer.merge(result.toUIMessageStream({ sendReasoning: true, sendSources: true }));
    },
    onError: (error) => {
      runtime.runSync(Effect.logError("chat failed", error));
      return String(error);
    },
  });

  await pipeUIMessageStreamToResponse({ response: res, stream });
});

app.listen(config.port, () => {
  runtime.runSync(Effect.logInfo("listening", { url: `http://localhost:${config.port}` }));
});
