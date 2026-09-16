import { createAnthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, convertToModelMessages, stepCountIs } from "ai";
import type { InferUIMessageChunk } from "ai";
import { Context, Data, Effect, Layer, Queue, Redacted, Stream } from "effect";
import type { AgentEvent } from "../../shared/agent-event.ts";
import type { ResearchUIMessage } from "../../shared/chat.ts";
import { AppConfig } from "../config.ts";
import { BaseAgent } from "./base-agent.ts";
import { logAgentEvent } from "./events.ts";
import { promptCache, researchInstructions, visibleReasoning } from "./prompts/research.ts";
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

export const ResearcherLive: Layer.Layer<Researcher, never, AppConfig> = Layer.effect(
  Researcher,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const anthropic = createAnthropic({ apiKey: Redacted.value(config.anthropicApiKey) });
    const agent = new BaseAgent(
      new ToolLoopAgent({
        model: anthropic(config.model),
        instructions: researchInstructions,
        tools: researchTools,
        stopWhen: stepCountIs(config.maxSteps),
        maxOutputTokens: config.maxOutputTokens,
        providerOptions: {
          anthropic: { ...promptCache.anthropic, ...visibleReasoning.anthropic },
        },
      }),
    );

    const answer = (messages: ReadonlyArray<ResearchUIMessage>) =>
      Stream.unwrap(
        Effect.gen(function* () {
          const events = yield* Queue.make<AgentEvent>();
          const modelMessages = yield* Effect.promise(() =>
            convertToModelMessages(Array.from(messages)),
          );
          const result = yield* Effect.promise(() =>
            agent.stream(modelMessages, (event) => Queue.offerUnsafe(events, event)),
          );

          const reply = Stream.fromAsyncIterable(
            result.toUIMessageStream<ResearchUIMessage>({ sendReasoning: true, sendSources: true }),
            (cause) => new ResearchError({ cause }),
          );
          const progress = Stream.fromQueue(events).pipe(
            Stream.tap(logAgentEvent),
            Stream.map((event): ResearchChunk => ({ type: "data-agent-event", data: event })),
          );

          return reply.pipe(Stream.merge(progress, { haltStrategy: "left" }));
        }),
      );

    return { answer };
  }),
);
