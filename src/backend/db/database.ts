import { SqliteClient } from "@effect/sql-sqlite-node";
import { Config, Effect, Layer, String as Str } from "effect";
import type { SqlClient, SqlError } from "effect/unstable/sql";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createTables } from "./schema.ts";

const databaseFile = Config.String("CHAT_DATABASE").pipe(Config.withDefault(".data/chats.sqlite"));

const client: Layer.Layer<SqlClient.SqlClient, Config.ConfigError> = Layer.unwrap(
  Effect.gen(function* () {
    const filename = yield* databaseFile;
    yield* Effect.promise(() => mkdir(path.dirname(filename), { recursive: true }));
    return SqliteClient.layer({
      filename,
      transformQueryNames: Str.camelToSnake,
      transformResultNames: Str.snakeToCamel,
    });
  }),
);

export const DatabaseLive: Layer.Layer<SqlClient.SqlClient, Config.ConfigError | SqlError.SqlError> =
  Layer.effectDiscard(createTables).pipe(Layer.provideMerge(client));
