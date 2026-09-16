import type { ModelMessage, ToolLoopAgent, ToolSet } from "ai";
import { Option } from "effect";
import { AgentEvent } from "./events.ts";

export interface ToolLoopOutcome {
  readonly draft: Option.Option<string>;
  readonly steps: number;
  readonly transcript: ReadonlyArray<ModelMessage>;
}

export class BaseAgent<TOOLS extends ToolSet> {
  readonly #loop: ToolLoopAgent<never, TOOLS>;

  constructor(loop: ToolLoopAgent<never, TOOLS>) {
    this.#loop = loop;
  }

  async ask(question: string, onEvent: (event: AgentEvent) => void): Promise<ToolLoopOutcome> {
    const result = await this.#loop.generate({
      prompt: question,
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

    return {
      draft: Option.liftPredicate(result.text, () => result.toolCalls.length === 0),
      steps: result.steps.length,
      transcript: [{ role: "user", content: question }, ...result.responseMessages],
    };
  }
}
