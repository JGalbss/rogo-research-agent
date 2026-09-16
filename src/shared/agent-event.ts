import { Data } from "effect";

export type AgentEvent = Data.TaggedEnum<{
  Iteration: { readonly n: number };
  ToolStart: { readonly name: string; readonly input: string };
  ToolEnd: { readonly name: string; readonly ms: number };
  ToolFailed: { readonly name: string; readonly message: string };
  Caveat: { readonly source: string; readonly message: string };
  Source: { readonly id: string; readonly title: string };
  Usage: {
    readonly step: number;
    readonly inputTokens: number;
    readonly cachedInputTokens: number;
    readonly outputTokens: number;
    readonly ms: number;
  };
}>;

export const AgentEvent = Data.taggedEnum<AgentEvent>();
