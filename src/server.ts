import "dotenv/config";
import express from "express";
import { AgentEvent } from "./agent/events.ts";
import { answerQuestion } from "./agent/research-agent.ts";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "\nANTHROPIC_API_KEY is not set.\nCopy .env.example to .env and add your key, then run `npm run dev` again.\n",
  );
  process.exit(1);
}

const app = express();
app.use(express.json());

const logEvent = AgentEvent.$match({
  Iteration: ({ n }) => console.log(`[agent] iteration ${n}`),
  ToolStart: ({ name, input }) => console.log(`[tool]  → ${name} ${input}`),
  ToolEnd: ({ name, ms }) => console.log(`[tool]  ← ${name} (${ms}ms)`),
  ToolFailed: ({ name, message }) => console.log(`[tool]  ! ${name}: ${message}`),
});

app.post("/api/chat", async (req, res) => {
  const message = String(req.body.message ?? "");
  console.log(`\n[chat] ${message}`);

  try {
    const result = await answerQuestion(message, logEvent);

    res.json({ answer: result.answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Agent server listening on http://localhost:${port}`);
});
