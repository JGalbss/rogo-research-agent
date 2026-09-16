import type { ModelMessage, ToolLoopAgent, ToolSet } from "ai";
import { AgentEvent } from "../../shared/agent-event.ts";

export class BaseAgent<TOOLS extends ToolSet> {
  readonly #loop: ToolLoopAgent<never, TOOLS>;

  constructor(loop: ToolLoopAgent<never, TOOLS>) {
    this.#loop = loop;
  }

  stream(
    messages: ModelMessage[],
    onEvent: (event: AgentEvent) => void,
  ): ReturnType<ToolLoopAgent<never, TOOLS>["stream"]> {
    return this.#loop.stream({
      messages,
      onStepStart: ({ stepNumber }) =>
        onEvent(AgentEvent.Iteration({ n: stepNumber + 1 })),
      onToolExecutionStart: ({ toolCall }) =>
        onEvent(
          AgentEvent.ToolStart({
            name: toolCall.toolName,
            input: JSON.stringify(toolCall.input),
          }),
        ),
      onToolExecutionEnd: ({ toolCall, toolOutput, toolExecutionMs }) => {
        if (toolOutput.type === "tool-error") {
          onEvent(
            AgentEvent.ToolFailed({
              name: toolCall.toolName,
              message: String(toolOutput.error),
            }),
          );
        }
        onEvent(
          AgentEvent.ToolEnd({ name: toolCall.toolName, ms: toolExecutionMs }),
        );
      },
    });
  }
}
