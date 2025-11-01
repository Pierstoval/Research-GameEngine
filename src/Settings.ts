import type {MiddlewareInterface} from "./Middleware";
import {StackMiddleware} from "./Middleware";

type PublicSettingsMiddlewares = Array<MiddlewareInterface>;

export type Settings<S = PublicSettingsMiddlewares> = {
    tickInterval?: number,

    startState?: null|Record<string, unknown>,

    middlewares: {
        // First and only launch of the game. If no current scene is available, it'll usually render one.
        start: S,

        // When receiving output from any kind of client connected to the game
        // Will usually contain middlewares like this: "validate input", "interact", and maybe "render"
        input: S,

        // Executed by the tickStrategy object, and usually contains "render" middlewares
        // In realtime, for instance, it'll always execute "render" in intervals of time.
        // In "PlayerClockwiseStrategy", it'll do render after "input" middlewares are all called
        tick: S,
    },
};

export type InternalGameSettings = Settings<StackMiddleware>;
