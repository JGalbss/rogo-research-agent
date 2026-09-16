import type { ModelMessage, ToolLoopAgent, ToolSet } from "ai";
import { MutableRef, Option, Schema } from "effect";
import { AgentEvent } from "../../shared/agent-event.ts";

export interface AgentRun {
  readonly messages: ModelMessage[];
  readonly onEvent: (event: AgentEvent) => void;
  readonly abortSignal: AbortSignal;
  readonly timeoutMs: number;
}

const WithWarnings = Schema.Struct({ warnings: Schema.Array(Schema.String) });
const DocumentHits = Schema.Array(Schema.Struct({ id: Schema.String, title: Schema.String }));

const warningsIn = Schema.decodeUnknownOption(WithWarnings);
const documentsIn = Schema.decodeUnknownOption(DocumentHits);

export class BaseAgent<TOOLS extends ToolSet> {
  readonly #loop: ToolLoopAgent<never, TOOLS>;

  constructor(loop: ToolLoopAgent<never, TOOLS>) {
    this.#loop = loop;
  }

  stream(run: AgentRun): ReturnType<ToolLoopAgent<never, TOOLS>["stream"]> {
    const { onEvent } = run;
    const step = MutableRef.make(0);
    const stepStartedAt = MutableRef.make(Date.now());

    return this.#loop.stream({
      messages: run.messages,
      abortSignal: run.abortSignal,
      timeout: { totalMs: run.timeoutMs },
      onStepStart: ({ stepNumber }) => {
        MutableRef.set(step, stepNumber + 1);
        MutableRef.set(stepStartedAt, Date.now());
        onEvent(AgentEvent.Iteration({ n: stepNumber + 1 }));
      },
      onStepEnd: ({ usage }) => {
        onEvent(
          AgentEvent.Usage({
            step: MutableRef.get(step),
            inputTokens: usage.inputTokens ?? 0,
            cachedInputTokens: usage.inputTokenDetails.cacheReadTokens ?? 0,
            outputTokens: usage.outputTokens ?? 0,
            ms: Date.now() - MutableRef.get(stepStartedAt),
          }),
        );
      },
      onToolExecutionStart: ({ toolCall }) =>
        onEvent(
          AgentEvent.ToolStart({ name: toolCall.toolName, input: JSON.stringify(toolCall.input) }),
        ),
      onToolExecutionEnd: ({ toolCall, toolOutput, toolExecutionMs }) => {
        const name = toolCall.toolName;
        if (toolOutput.type === "tool-error") {
          onEvent(AgentEvent.ToolFailed({ name, message: String(toolOutput.error) }));
        }
        if (toolOutput.type === "tool-result") {
          Option.map(warningsIn(toolOutput.output), ({ warnings }) =>
            warnings.forEach((message) => onEvent(AgentEvent.Caveat({ source: name, message }))),
          );
          Option.map(documentsIn(toolOutput.output), (hits) =>
            hits.forEach(({ id, title }) => onEvent(AgentEvent.Source({ id, title }))),
          );
        }
        onEvent(AgentEvent.ToolEnd({ name, ms: toolExecutionMs }));
      },
    });
  }
}
