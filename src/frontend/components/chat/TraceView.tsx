import type { ReactElement } from "react";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import { Reply, type TurnPhase } from "@/frontend/utils/reply";
import { SourcePills } from "./SourcePills.tsx";
import { type TraceRow, traceHeadline, traceSources, traceSummary } from "@/frontend/utils/trace";

export function TraceView({
  rows,
  reply,
  turn,
}: {
  rows: TraceRow[];
  reply: Reply;
  turn: TurnPhase;
}): ReactElement | null {
  const working = Reply.$is("Working")(reply);
  if (rows.length === 0 && !working) return null;
  return (
    <ThinkingState
      variant="Coding"
      rows={rows}
      active={traceHeadline(rows)}
      done={traceSummary(rows)}
      working={working}
      settled={turn === "settled"}
      trailing={<SourcePills subjects={traceSources(rows)} />}
    />
  );
}
