import { Effect } from "effect";
import { AgentEvent } from "../../shared/agent-event.ts";

export const logAgentEvent: (event: AgentEvent) => Effect.Effect<void> =
  AgentEvent.$match({
    Iteration: ({ n }) => Effect.logInfo("iteration", { n }),
    ToolStart: ({ name, input }) =>
      Effect.logInfo("tool start", { name, input }),
    ToolEnd: ({ name, ms }) => Effect.logInfo("tool end", { name, ms }),
    ToolFailed: ({ name, message }) =>
      Effect.logWarning("tool failed", { name, message }),
  });
