import {MiddlewareContext, StackMiddleware} from "./Middleware";
import type {InternalGameSettings, Settings} from "./Settings";
import {TickStrategy} from "./TickStrategy";

export type RunningState = 'running'|'paused'|'stopped'|'uninitialized';

export type IncomingInput = Record<string, any>|string|null;

export class Engine {
    private runningState: RunningState = 'uninitialized';

    private readonly middlewarecontext: MiddlewareContext;

    private readonly startMiddlewares: StackMiddleware;
    private readonly inputMiddlewares: StackMiddleware;
    private readonly tickMiddlewares: StackMiddleware;
    private readonly tickStrategy: TickStrategy;

    constructor(settings: Settings) {
        const internalGameSettings = validateSettings(settings);

        this.startMiddlewares = internalGameSettings.middlewares.start;
        this.inputMiddlewares = internalGameSettings.middlewares.input;
        this.tickMiddlewares = internalGameSettings.middlewares.tick;
        this.tickStrategy = internalGameSettings.tickStrategy;

        this.middlewarecontext = {
            engine: this,
            lastInput: null,
            stateData: settings?.startState,
        };
    }

    public async input(input: IncomingInput) {
        if (this.runningState !== 'running') {
            return
        }
        this.middlewarecontext.lastInput = input;
        await this.inputMiddlewares.handle(this.middlewarecontext, this.inputMiddlewares);
        this.inputMiddlewares.reset();
        await this.tick();
    }

    public async start() {
        if (this.runningState !== 'uninitialized') {
            throw new Error('Cannot start an engine more than once. Current state is : '+this.runningState);
        }
        this.runningState = 'running';
        await this.startMiddlewares.handle(this.middlewarecontext, this.startMiddlewares);
        this.startMiddlewares.reset();
        await this.tick();
    }

    public async stop() {
        if (this.runningState === 'stopped') {
            throw new Error('Engine is already stopped.');
        }
        this.runningState = 'stopped';
        await this.tick();
    }

    public async pause() {
        if (this.runningState === 'stopped') {
            throw new Error('Engine cannot be paused: it is stopped.');
        }
        this.runningState = 'paused';
        await this.tick();
    }

    public async resume() {
        if (this.runningState !== 'paused') {
            throw new Error('Engine can only be resumed if it has been paused.');
        }
        this.runningState = 'running';
        await this.tick();
    }

    private async tick()
    {
        if (this.runningState === 'stopped') {
            return;
        }

        if (this.tickStrategy.willTick()) {
            await this.tickMiddlewares.handle(this.middlewarecontext, this.tickMiddlewares);
            this.tickMiddlewares.reset();
        }
    }
}

function validateSettings(settings: Settings): InternalGameSettings {
    // Throw error in case anything's wrong: game can't be created then.

    if (!settings.tickStrategy) {
        throw new Error('Tick strategy is mandatory.');
    }

    return {
        middlewares: {
            start: new StackMiddleware(settings.middlewares?.start ?? []),
            input: new StackMiddleware(settings.middlewares?.input ?? []),
            tick: new StackMiddleware(settings.middlewares?.tick ?? []),
        },
        tickStrategy: settings.tickStrategy,
    };
}
