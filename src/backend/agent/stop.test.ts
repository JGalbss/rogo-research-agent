import { describe, expect, it } from "vitest";
import { planStep } from "./stop.ts";

const budget = { maxSteps: 12, answerByMs: 45_000, abortAfterMs: 90_000 };
const call = (toolName: string, input: Record<string, string>) => ({ toolName, input });

describe("planStep", () => {
  it("keeps researching while the budget holds", () => {
    const plan = planStep({
      stepNumber: 1,
      steps: [{ toolCalls: [call("getFinancials", { company: "Acme Corp" })] }],
      elapsedMs: 1_000,
      budget,
    });
    expect(plan._tag).toBe("Research");
  });

  it("answers on the last step of the budget", () => {
    const plan = planStep({ stepNumber: 11, steps: [], elapsedMs: 0, budget });
    expect(plan).toMatchObject({ _tag: "Answer", reason: "last step" });
  });

  it("answers once the deadline has passed", () => {
    const plan = planStep({ stepNumber: 2, steps: [], elapsedMs: 45_000, budget });
    expect(plan).toMatchObject({ _tag: "Answer", reason: "deadline" });
  });

  it("answers when the last step repeats an earlier tool call", () => {
    const plan = planStep({
      stepNumber: 3,
      steps: [
        { toolCalls: [call("getFinancials", { company: "Acme Corp" })] },
        { toolCalls: [call("searchDocuments", { query: "risks" })] },
        { toolCalls: [call("getFinancials", { company: "Acme Corp" })] },
      ],
      elapsedMs: 0,
      budget,
    });
    expect(plan).toMatchObject({ _tag: "Answer", reason: "repeated tool call" });
  });

  it("does not treat a repeat within one step as looping", () => {
    const plan = planStep({
      stepNumber: 1,
      steps: [
        {
          toolCalls: [
            call("getFinancials", { company: "Acme Corp" }),
            call("getFinancials", { company: "Acme Corp" }),
          ],
        },
      ],
      elapsedMs: 0,
      budget,
    });
    expect(plan._tag).toBe("Research");
  });
});
