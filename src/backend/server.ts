import express, { type Request as HttpRequest, type Response as HttpResponse } from "express";
import { createUIMessageStream, generateId } from "ai";
import { Data, Effect, Fiber, Option, Schema, Stream } from "effect";
import { ChatId, ChatMessage, type ResearchUIMessage } from "../shared/chat.ts";
import { Researcher } from "./agent/research-agent.ts";
import { ChatIndex } from "./chat-index.ts";
import { ChatStore, newChat } from "./chat.service.ts";
import { AppConfig } from "./config.ts";
import { DurableStreams } from "./streams.ts";
import { runtime } from "./utils/runtime.ts";

const ChatRequest = Schema.Struct({
  id: ChatId,
  messages: Schema.Array(ChatMessage),
});

class InvalidChatRequest extends Data.TaggedError("InvalidChatRequest")<{
  readonly cause: unknown;
}> {}

type Services = Researcher | ChatStore | ChatIndex | DurableStreams;

const turn = (
  request: typeof ChatRequest.Type,
): Effect.Effect<Response, never, Services> =>
  Effect.gen(function* () {
    const researcher = yield* Researcher;
    const store = yield* ChatStore;
    const index = yield* ChatIndex;
    const streams = yield* DurableStreams;
    const context = yield* Effect.context();
    const run = Effect.runPromiseWith(context);
    const fork = Effect.runForkWith(context);

    const messages: ResearchUIMessage[] = Array.from(request.messages);
    const chat = yield* store.get(request.id).pipe(
      Effect.flatMap(
        Option.match({ onNone: () => newChat(request.id), onSome: Effect.succeed }),
      ),
    );
    yield* store.put({ ...chat, messages });

    const streamId = generateId();
    const target = streams.target(request.id, streamId);
    const readUrl = String(target.readUrl);

    const source = createUIMessageStream<ResearchUIMessage>({
      originalMessages: messages,
      execute: ({ writer }) => {
        const generation = fork(
          Stream.runForEach(researcher.answer(messages), (chunk) =>
            Effect.sync(() => writer.write(chunk)),
          ),
        );
        streams.markActive(request.id, { readUrl, interrupt: Fiber.interrupt(generation) });
        return run(Fiber.join(generation));
      },
      onFinish: ({ messages: final }) =>
        run(
          Effect.gen(function* () {
            yield* store.put({ ...chat, messages: final });
            streams.clearActive(request.id);
            yield* index.emit({ _tag: "GenerationFinished", chatId: request.id, streamId });
          }),
        ),
      onError: (error) => String(error),
    });

    yield* index.emit({ _tag: "GenerationStarted", chatId: request.id, streamId, readUrl });
    yield* Effect.logInfo("chat", { chatId: request.id, messages: messages.length, streamId });

    return yield* streams.publish(target, source);
  }).pipe(Effect.orDie);

const respond = (res: HttpResponse, route: Effect.Effect<void, never, Services>): void => {
  runtime.runFork(
    route.pipe(
      Effect.catchCause((cause) =>
        Effect.gen(function* () {
          yield* Effect.logError("request failed", cause);
          if (res.headersSent) return;
          res.status(500).json({ error: "internal error" });
        }),
      ),
    ),
  );
};

const app = express();
app.use(express.json());

app.post("/api/chat", (req: HttpRequest, res: HttpResponse) => {
  respond(
    res,
    Effect.gen(function* () {
      const request = yield* Schema.decodeUnknownEffect(ChatRequest)(req.body).pipe(
        Effect.mapError((cause) => new InvalidChatRequest({ cause })),
      );
      const pointer = yield* turn(request);
      const body = yield* Effect.promise(() => pointer.text());
      pointer.headers.forEach((value, name) => res.setHeader(name, value));
      res.status(pointer.status).send(body);
    }).pipe(
      Effect.catchTag("InvalidChatRequest", (error) =>
        Effect.logWarning("invalid chat request", error.cause).pipe(
          Effect.map(() => {
            res.status(400).json({ error: "expected { id, messages }" });
          }),
        ),
      ),
    ),
  );
});

app.post("/api/chat/:id/stop", (req: HttpRequest, res: HttpResponse) => {
  respond(
    res,
    Effect.gen(function* () {
      const streams = yield* DurableStreams;
      yield* Option.match(streams.active(String(req.params.id)), {
        onNone: () => Effect.sync(() => res.sendStatus(204)),
        onSome: (generation) =>
          generation.interrupt.pipe(Effect.map(() => res.sendStatus(202))),
      });
    }),
  );
});

app.get("/api/chats", (_req: HttpRequest, res: HttpResponse) => {
  respond(
    res,
    Effect.gen(function* () {
      const store = yield* ChatStore;
      const chats = yield* store.list.pipe(Effect.orDie);
      res.json(chats);
    }),
  );
});

app.get("/api/chat/:id", (req: HttpRequest, res: HttpResponse) => {
  respond(
    res,
    Effect.gen(function* () {
      const store = yield* ChatStore;
      const id = yield* Schema.decodeUnknownEffect(ChatId)(req.params.id).pipe(Effect.option);
      const chat = yield* Option.match(id, {
        onNone: () => Effect.succeed(Option.none()),
        onSome: (chatId) => store.get(chatId).pipe(Effect.orDie),
      });
      Option.match(chat, {
        onNone: () => res.sendStatus(404),
        onSome: (found) => res.json(found),
      });
    }),
  );
});

app.get("/api/chat/:id/stream", (req: HttpRequest, res: HttpResponse) => {
  respond(
    res,
    Effect.gen(function* () {
      const streams = yield* DurableStreams;
      Option.match(streams.active(String(req.params.id)), {
        onNone: () => res.sendStatus(204),
        onSome: ({ readUrl }) => res.status(200).location(readUrl).json({ streamUrl: readUrl }),
      });
    }),
  );
});

const boot = Effect.gen(function* () {
  const config = yield* AppConfig;
  yield* DurableStreams;
  yield* Effect.callback<void>((resume) => {
    app.listen(config.port, () => resume(Effect.void));
  });
  yield* Effect.logInfo("listening", { url: `http://localhost:${config.port}` });
});

runtime.runPromise(boot);
process.once("SIGINT", () => {
  runtime.dispose().then(() => process.exit(0));
});
