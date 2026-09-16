import express from "express";
import { Effect } from "effect";
import { AgentEvent } from "./agent/events.ts";
import { answerQuestion } from "./agent/research-agent.ts";
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

app.post("/api/chat", async (req, res) => {
  const message = String(req.body.message ?? "");
  runtime.runSync(Effect.logInfo("chat", { message }));

  try {
    const result = await answerQuestion(message, (event) => runtime.runSync(logEvent(event)));
    res.json({ answer: result.answer });
  } catch (err) {
    runtime.runSync(Effect.logError("chat failed", err));
    res.status(500).json({ error: String(err) });
  }
});

app.listen(config.port, () => {
  runtime.runSync(Effect.logInfo("listening", { url: `http://localhost:${config.port}` }));
});
