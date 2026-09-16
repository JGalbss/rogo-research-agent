import { config as loadDotenv } from "dotenv";
import { Config, Effect } from "effect";
import { runtime } from "./utils/runtime.ts";

loadDotenv();

const AppConfig = Config.all({
  anthropicApiKey: Config.Redacted("ANTHROPIC_API_KEY"),
  model: Config.String("ROGO_MODEL").pipe(Config.withDefault("claude-sonnet-5")),
  maxSteps: Config.Int("MAX_STEPS").pipe(Config.withDefault(12)),
  maxOutputTokens: Config.Int("MAX_OUTPUT_TOKENS").pipe(Config.withDefault(16000)),
  port: Config.Port("PORT").pipe(Config.withDefault(8787)),
});

export type AppConfig = Effect.Success<typeof AppConfig>;

export const config: AppConfig = runtime.runSync(
  AppConfig.pipe(
    Effect.tapError(() =>
      Effect.logError("invalid configuration. Copy .env.example to .env and set ANTHROPIC_API_KEY."),
    ),
  ),
);
