import { Data } from "effect";

export type AgentEvent = Data.TaggedEnum<{
  Iteration: { readonly n: number };
  ToolStart: { readonly name: string; readonly input: string };
  ToolEnd: { readonly name: string; readonly ms: number };
  ToolFailed: { readonly name: string; readonly message: string };
}>;

export const AgentEvent = Data.taggedEnum<AgentEvent>();
