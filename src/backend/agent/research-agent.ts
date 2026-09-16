import { createAnthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, convertToModelMessages, stepCountIs } from "ai";
import type { InferUIMessageChunk } from "ai";
import { Context, Data, Effect, Layer, Queue, Redacted, Stream } from "effect";
import { AgentEvent } from "../../shared/agent-event.ts";
import type { ResearchUIMessage } from "../../shared/chat.ts";
import { AppConfig } from "../config.ts";
import { BaseAgent } from "./base-agent.ts";
import { logAgentEvent } from "./events.ts";
import { memoizeToolCalls } from "./memo.ts";
import { promptCache, researchInstructions, visibleReasoning } from "./prompts/research.ts";
import { StepPlan, answerWithinBudget } from "./stop.ts";
import { researchTools } from "./tools/index.ts";

export class ResearchError extends Data.TaggedError("ResearchError")<{
  readonly cause: unknown;
}> {}

export type ResearchChunk = InferUIMessageChunk<ResearchUIMessage>;

export class Researcher extends Context.Service<
  Researcher,
  {
    readonly answer: (
      messages: ReadonlyArray<ResearchUIMessage>,
    ) => Stream.Stream<ResearchChunk, ResearchError>;
  }
>()("Researcher") {}

const logPlan = StepPlan.$match({
  Research: () => Effect.void,
  Answer: ({ reason }) => Effect.logInfo("answering now", { reason }),
});

const progressChunk = (event: AgentEvent): ResearchChunk => ({
  type: "data-agent-event",
  data: event,
});

const chunksFor: (event: AgentEvent) => ReadonlyArray<ResearchChunk> = AgentEvent.$match({
  Iteration: (event) => [progressChunk(event)],
  ToolStart: (event) => [progressChunk(event)],
  ToolEnd: (event) => [progressChunk(event)],
  ToolFailed: (event) => [progressChunk(event)],
  Caveat: (event) => [progressChunk(event)],
  Source: ({ id, title }): ReadonlyArray<ResearchChunk> => [
    { type: "source-document", sourceId: id, mediaType: "text/plain", title },
  ],
  Usage: () => [],
});

export const ResearcherLive: Layer.Layer<Researcher, never, AppConfig> = Layer.effect(
  Researcher,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const anthropic = createAnthropic({ apiKey: Redacted.value(config.anthropicApiKey) });
    const budget = {
      maxSteps: config.maxSteps,
      answerByMs: config.answerByMs,
      abortAfterMs: config.abortAfterMs,
    };

    const answer = (messages: ReadonlyArray<ResearchUIMessage>) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const events = yield* Queue.make<AgentEvent>();
          const plans = yield* Queue.make<StepPlan>();
          const abort = new AbortController();
          yield* Effect.addFinalizer(() => Effect.sync(() => abort.abort()));

          const agent = new BaseAgent(
            new ToolLoopAgent({
              model: anthropic(config.model),
              instructions: researchInstructions,
              tools: memoizeToolCalls(researchTools),
              stopWhen: stepCountIs(budget.maxSteps),
              prepareStep: answerWithinBudget(budget, (plan) => Queue.offerUnsafe(plans, plan)),
              maxOutputTokens: config.maxOutputTokens,
              providerOptions: {
                anthropic: {
                  ...promptCache.anthropic,
                  ...visibleReasoning.anthropic,
                  effort: config.effort,
                },
              },
            }),
          );

          const modelMessages = yield* Effect.promise(() =>
            convertToModelMessages(Array.from(messages)),
          );
          const result = yield* Effect.promise(() =>
            agent.stream({
              messages: modelMessages,
              onEvent: (event) => Queue.offerUnsafe(events, event),
              abortSignal: abort.signal,
              timeoutMs: budget.abortAfterMs,
            }),
          );

          const reply = Stream.fromAsyncIterable(
            result.toUIMessageStream<ResearchUIMessage>({ sendReasoning: true, sendSources: true }),
            (cause) => new ResearchError({ cause }),
          );
          const progress = Stream.fromQueue(events).pipe(
            Stream.tap(logAgentEvent),
            Stream.flatMap((event) => Stream.fromIterable(chunksFor(event))),
          );
          const planning = Stream.fromQueue(plans).pipe(Stream.tap(logPlan), Stream.drain);

          return reply.pipe(
            Stream.merge(progress, { haltStrategy: "left" }),
            Stream.merge(planning, { haltStrategy: "left" }),
          );
        }),
      );

    return { answer };
  }),
);
