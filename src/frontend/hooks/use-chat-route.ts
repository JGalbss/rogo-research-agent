import { Option, Schema } from "effect";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import { selectChat } from "@/frontend/store/selection";
import { ChatId } from "@/shared/chat";

const chatParam = parseAsString.withOptions({ history: "push" });

export const useChatRoute = (selected: ChatId): void => {
  const [param, setParam] = useQueryState("chat", chatParam);
  const previous = useRef<{ param: string | null; selected: ChatId }>({ param: null, selected });

  useEffect(() => {
    const paramChanged = previous.current.param !== param;
    const selectionChanged = previous.current.selected !== selected;
    previous.current = { param, selected };
    const requested = Option.filter(Schema.decodeUnknownOption(ChatId)(param), (id) => id !== selected);
    if (paramChanged && Option.isSome(requested)) {
      selectChat(requested.value);
      return;
    }
    if (param === null) {
      void setParam(selected, { history: "replace" });
      return;
    }
    if (selectionChanged && param !== selected) void setParam(selected);
  }, [param, selected, setParam]);
};
