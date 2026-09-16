import type { PrepareStepFunction, ToolSet } from "ai";
import { Array as Arr, Data, HashSet, Option, pipe } from "effect";

export interface RunBudget {
  readonly maxSteps: number;
  readonly answerByMs: number;
  readonly abortAfterMs: number;
}

export interface IssuedToolCall {
  readonly toolName: string;
  readonly input: unknown;
}

export interface CompletedStep {
  readonly toolCalls: ReadonlyArray<IssuedToolCall>;
}

export type StepPlan = Data.TaggedEnum<{
  Research: {};
  Answer: { readonly reason: "last step" | "deadline" | "repeated tool call" };
}>;

export const StepPlan = Data.taggedEnum<StepPlan>();

const callKey = (call: IssuedToolCall): string => `${call.toolName}:${JSON.stringify(call.input)}`;

export const planStep = (input: {
  readonly stepNumber: number;
  readonly steps: ReadonlyArray<CompletedStep>;
  readonly elapsedMs: number;
  readonly budget: RunBudget;
}): StepPlan => {
  if (input.stepNumber >= input.budget.maxSteps - 1) return StepPlan.Answer({ reason: "last step" });
  if (input.elapsedMs >= input.budget.answerByMs) return StepPlan.Answer({ reason: "deadline" });

  const repeated = Option.match(Arr.last(input.steps), {
    onNone: () => false,
    onSome: (last) => {
      const earlier = pipe(
        Arr.take(input.steps, input.steps.length - 1),
        Arr.flatMap((step) => step.toolCalls.map(callKey)),
        HashSet.fromIterable,
      );
      return last.toolCalls.some((call) => HashSet.has(earlier, callKey(call)));
    },
  });
  if (repeated) return StepPlan.Answer({ reason: "repeated tool call" });

  return StepPlan.Research();
};

export const answerWithinBudget = (
  budget: RunBudget,
  onPlan: (plan: StepPlan) => void,
): PrepareStepFunction<ToolSet> => {
  const startedAt = Date.now();
  return ({ stepNumber, steps }) => {
    const plan = planStep({ stepNumber, steps, elapsedMs: Date.now() - startedAt, budget });
    onPlan(plan);
    return StepPlan.$match(plan, {
      Research: () => undefined,
      Answer: () => ({ toolChoice: "none" as const }),
    });
  };
};
