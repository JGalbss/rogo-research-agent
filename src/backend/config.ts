import { config as loadDotenv } from "dotenv";
import { Config, Context, Effect, Layer } from "effect";

loadDotenv();

const settings = Config.all({
  anthropicApiKey: Config.Redacted("ANTHROPIC_API_KEY"),
  model: Config.String("ROGO_MODEL").pipe(Config.withDefault("claude-sonnet-5")),
  maxSteps: Config.Int("MAX_STEPS").pipe(Config.withDefault(12)),
  maxOutputTokens: Config.Int("MAX_OUTPUT_TOKENS").pipe(Config.withDefault(16000)),
  port: Config.Port("PORT").pipe(Config.withDefault(8787)),
  durableStreamsPort: Config.Port("DURABLE_STREAMS_PORT").pipe(Config.withDefault(4437)),
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
