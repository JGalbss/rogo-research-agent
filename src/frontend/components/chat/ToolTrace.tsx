import { getToolName, isToolUIPart } from "ai";
import { HashMap, Match, Option } from "effect";
import type { ReactElement } from "react";
import ToolChips, { type ToolStep } from "@/frontend/components/primitives/ToolChips";
import { AgentEvent } from "@/shared/agent-event";
import type { ResearchUIMessage } from "@/shared/chat";

type Part = ResearchUIMessage["parts"][number];
type ToolPart = Extract<Part, { toolCallId: string }>;

const PREVIEW_LENGTH = 160;

export function ToolTrace({ parts }: { parts: ReadonlyArray<Part> }): ReactElement | null {
  const timings = HashMap.fromIterable(
    parts.flatMap((part) =>
      part.type === "data-agent-event" && AgentEvent.$is("ToolEnd")(part.data)
        ? [[part.data.name, part.data.ms] as const]
        : [],
    ),
  );

  const steps = parts.filter(isToolUIPart).map((part: ToolPart): ToolStep => {
    const name = getToolName(part);
    const detail = Match.value(part).pipe(
      Match.when({ state: "output-error" }, ({ errorText }) => `failed: ${errorText ?? "unknown"}`),
      Match.when({ state: "output-available" }, ({ output }) =>
        Option.match(HashMap.get(timings, name), {
          onNone: () => JSON.stringify(output).slice(0, PREVIEW_LENGTH),
          onSome: (ms) => `${ms} ms · ${JSON.stringify(output).slice(0, PREVIEW_LENGTH)}`,
        }),
      ),
      Match.orElse(() => "running…"),
    );
    return {
      icon: "run",
      label: name,
      chip: JSON.stringify(part.input ?? {}).slice(0, PREVIEW_LENGTH),
      mono: true,
      detailMono: true,
      detail: [{ text: detail }],
    };
  });

  if (steps.length === 0) return null;
  return (
    <ToolChips
      steps={steps}
      diffs={[]}
      diffLines={{}}
      labels={{ header: `${steps.length} tool calls`, more: "" }}
    />
  );
}
