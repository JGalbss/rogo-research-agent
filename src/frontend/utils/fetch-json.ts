import { Effect } from "effect";

export const fetchJson = (url: string): Effect.Effect<unknown, Error> =>
  Effect.tryPromise({ try: () => fetch(url), catch: () => new Error(`${url} unreachable`) }).pipe(
    Effect.filterOrFail(
      (response) => response.ok,
      (response) => new Error(`${url} answered ${response.status}`),
    ),
    Effect.flatMap((response) =>
      Effect.tryPromise({ try: () => response.json(), catch: () => new Error(`${url} is not json`) }),
    ),
  );
