import type { ModelMessage, ToolLoopAgent, ToolSet } from "ai";
import { AgentEvent } from "../../shared/agent-event.ts";

export interface AgentRun {
  readonly messages: ModelMessage[];
  readonly onEvent: (event: AgentEvent) => void;
  readonly abortSignal: AbortSignal;
  readonly timeoutMs: number;
}

export class BaseAgent<TOOLS extends ToolSet> {
  readonly #loop: ToolLoopAgent<never, TOOLS>;

  constructor(loop: ToolLoopAgent<never, TOOLS>) {
    this.#loop = loop;
  }

  stream(run: AgentRun): ReturnType<ToolLoopAgent<never, TOOLS>["stream"]> {
    const { onEvent } = run;
    return this.#loop.stream({
      messages: run.messages,
      abortSignal: run.abortSignal,
      timeout: { totalMs: run.timeoutMs },
      onStepStart: ({ stepNumber }) => onEvent(AgentEvent.Iteration({ n: stepNumber + 1 })),
      onToolExecutionStart: ({ toolCall }) =>
        onEvent(
          AgentEvent.ToolStart({ name: toolCall.toolName, input: JSON.stringify(toolCall.input) }),
        ),
      onToolExecutionEnd: ({ toolCall, toolOutput, toolExecutionMs }) => {
        if (toolOutput.type === "tool-error") {
          onEvent(
            AgentEvent.ToolFailed({ name: toolCall.toolName, message: String(toolOutput.error) }),
          );
        }
        onEvent(AgentEvent.ToolEnd({ name: toolCall.toolName, ms: toolExecutionMs }));
      },
    });
  }
}
