import { config as loadDotenv } from "dotenv";
import { Config, Context, Effect, Layer } from "effect";

loadDotenv();

const settings = Config.all({
  anthropicApiKey: Config.Redacted("ANTHROPIC_API_KEY"),
  model: Config.String("ROGO_MODEL").pipe(Config.withDefault("claude-sonnet-5")),
  maxSteps: Config.Int("MAX_STEPS").pipe(Config.withDefault(12)),
  maxOutputTokens: Config.Int("MAX_OUTPUT_TOKENS").pipe(Config.withDefault(4000)),
  effort: Config.Literals(["low", "medium", "high", "xhigh", "max"], "ROGO_EFFORT").pipe(
    Config.withDefault("medium"),
  ),
  answerByMs: Config.Int("ANSWER_BY_MS").pipe(Config.withDefault(45_000)),
  abortAfterMs: Config.Int("ABORT_AFTER_MS").pipe(Config.withDefault(90_000)),
  port: Config.Port("PORT").pipe(Config.withDefault(8787)),
  durableStreamsPort: Config.Port("DURABLE_STREAMS_PORT").pipe(Config.withDefault(4437)),
  durableStreamsDir: Config.String("DURABLE_STREAMS_DIR").pipe(Config.withDefault(".data/streams")),
});

export class AppConfig extends Context.Service<AppConfig, Effect.Success<typeof settings>>()(
  "AppConfig",
) {}

export const AppConfigLive: Layer.Layer<AppConfig, Config.ConfigError> = Layer.effect(
  AppConfig,
  settings.pipe(
    Effect.tapError(() =>
      Effect.logError("invalid configuration. Copy .env.example to .env and set ANTHROPIC_API_KEY."),
    ),
  ),
);
