import type { InferUITools, UIMessage } from "ai";
import type { AgentEvent } from "../backend/agent/events.ts";
import type { researchTools } from "../backend/agent/tools/index.ts";

export type ResearchDataParts = {
  readonly "agent-event": AgentEvent;
};

export type ResearchUIMessage = UIMessage<
  unknown,
  ResearchDataParts,
  InferUITools<typeof researchTools>
>;
