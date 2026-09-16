import { ConfigProvider, Effect, Logger } from "effect";
import { describe, expect, it } from "vitest";
import { LoggerLive } from "./logger.ts";

const levelsLoggedWith = (env: Record<string, string>): Promise<ReadonlyArray<string>> =>
  Effect.gen(function* () {
    const seen: Array<string> = [];
    const probe = Logger.make(({ logLevel }) => {
      seen.push(logLevel);
    });
    yield* Effect.all([Effect.logDebug("d"), Effect.logInfo("i"), Effect.logWarning("w")]).pipe(
      Effect.provide(Logger.layer([probe])),
    );
    return seen;
  }).pipe(
    Effect.provide(LoggerLive),
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env }))),
    Effect.runPromise,
  );

describe("LoggerLive", () => {
  it("defaults the minimum level to Info", async () => {
    expect(await levelsLoggedWith({})).toEqual(["Info", "Warn"]);
  });

  it("filters below LOG_LEVEL", async () => {
    expect(await levelsLoggedWith({ LOG_LEVEL: "Warn" })).toEqual(["Warn"]);
  });

  it("fails on an unknown LOG_LEVEL", async () => {
    const error = await Effect.log("x").pipe(
      Effect.provide(LoggerLive),
      Effect.provide(ConfigProvider.layer(ConfigProvider.fromEnv({ env: { LOG_LEVEL: "loud" } }))),
      Effect.flip,
      Effect.runPromise,
    );
    expect(error._tag).toBe("ConfigError");
  });
});
