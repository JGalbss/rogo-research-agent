import { generateId } from "ai";
import { Option, Schema } from "effect";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { loadChat } from "@/frontend/store/snapshot";
import { ChatId } from "@/shared/chat";

const chatParam = parseAsString.withOptions({ history: "push" });

export interface ChatSelection {
  readonly selected: ChatId;
  readonly select: (id: ChatId) => void;
  readonly startNew: () => void;
}

export const useSelectedChat = (): ChatSelection => {
  const [param, setParam] = useQueryState("chat", chatParam);
  const [fresh] = useState(generateId);
  const selected = Option.getOrElse(Schema.decodeUnknownOption(ChatId)(param), () => fresh);

  useEffect(() => {
    void loadChat(selected);
    if (param === null) void setParam(selected, { history: "replace" });
  }, [param, selected, setParam]);

  return {
    selected,
    select: (id) => {
      void setParam(id);
    },
    startNew: () => {
      void setParam(generateId());
    },
  };
};
