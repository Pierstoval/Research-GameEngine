import {StackMiddleware, StateContext} from "./Middleware";
import {Engine} from "./Engine";

export class TickLoop {
    private intervalId: number = 0;
    private _tickIntervalInMs: number;
    private _context: StateContext;
    private readonly tickMiddlewares: StackMiddleware;
    private readonly engine: Engine;

    public constructor(engine: Engine, tickMiddlewares: StackMiddleware, baseContext: StateContext, intervalInMs: number) {
        this.engine = engine;
        this.tickMiddlewares = tickMiddlewares;
        this._tickIntervalInMs = intervalInMs;
    }

    get context(): StateContext {
        return this._context;
    }

    set context(newContext: StateContext) {
        this._context = newContext;
    }

    tick(): Promise<void> {
        const result = this.tickMiddlewares.handle(this.context, this.engine, this.tickMiddlewares);
        this.tickMiddlewares.reset();
        return result;
    }

    start(): void {
        if (this.intervalId > 0) {
            throw new Error('Tick loop was already started');
        }

        if (!this._tickIntervalInMs) {
            // Don't start if there is no interval
            // This allows users to create a game loop that ticks only on manual actions (like "input").
            return;
        }

        this.intervalId = setInterval(() => this.tick(), this._tickIntervalInMs);
    }

    stop(): void {
        clearInterval(this.intervalId);
        this.intervalId = 0;
    }

    updateInterval(newIntervalInMs: number): void {
        this._tickIntervalInMs = newIntervalInMs;
        this.stop();
        this.start();
    }
}
