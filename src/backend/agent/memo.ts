import type { Tool, ToolSet } from "ai";
import { MutableHashMap, Option, Record } from "effect";

type ToolOutput = ReturnType<NonNullable<Tool["execute"]>>;

export const memoizeToolCalls = (tools: ToolSet): ToolSet => {
  const results = MutableHashMap.empty<string, ToolOutput>();

  return Record.map(tools, (tool, name): Tool => {
    const execute = tool.execute;
    if (execute === undefined) return tool;
    return {
      ...tool,
      execute: (input, options) => {
        const key = `${name}:${JSON.stringify(input)}`;
        return Option.getOrElse(MutableHashMap.get(results, key), () => {
          const output = execute(input, options);
          MutableHashMap.set(results, key, output);
          return output;
        });
      },
    };
  });
};
