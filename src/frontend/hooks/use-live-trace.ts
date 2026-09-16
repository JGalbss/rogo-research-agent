import { Array as Arr, Option } from "effect";
import { Reply } from "@/frontend/components/chat/reply";
import type { TraceRow } from "@/frontend/components/chat/trace";
import { useSmoothedText } from "./use-smoothed-text.ts";

export const useLiveTrace = (reply: Reply): TraceRow[] => {
  const live = Reply.$is("Working")(reply)
    ? Option.filter(Arr.last(reply.rows), (row) => row.kind === "thought")
    : Option.none();
  const shown = useSmoothedText(
    Option.match(live, { onNone: () => "", onSome: (row) => row.primary }),
    Option.isSome(live) ? "live" : "instant",
  );
  return Option.match(live, {
    onNone: () => reply.rows,
    onSome: (row) => [...reply.rows.slice(0, -1), { ...row, primary: shown, streaming: true }],
  });
};
