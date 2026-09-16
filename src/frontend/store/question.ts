import { Schema } from "effect";
import type { Option } from "effect";

export const Question = Schema.NonEmptyString;
export type Question = typeof Question.Type;

export const parseQuestion = (text: string): Option.Option<Question> =>
  Schema.decodeUnknownOption(Question)(text.trim());
