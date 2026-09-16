import { Config, Layer, Logger, References } from "effect";

const minimumLogLevel = Config.LogLevel("LOG_LEVEL").pipe(Config.withDefault("Info"));

export const LoggerLive: Layer.Layer<never, Config.ConfigError> = Layer.mergeAll(
  Logger.layer([Logger.consolePretty()]),
  Layer.effect(References.MinimumLogLevel, minimumLogLevel),
);
