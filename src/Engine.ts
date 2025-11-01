import {
    MiddlewareInterface,
    StackMiddleware,
    StateContext,
    UpdateSettingsMiddleware
} from "./Middleware.ts";
import type {InternalGameSettings, Settings} from "./Settings.ts";
import {TickLoop} from "./TickLoop.ts";

export type RunningState = 'running'|'paused'|'stopped'|'uninitialized';

export type IncomingInput = Record<string, any>|string|null;

export const DEFAULT_TICK_INTERVAL_MS = 20;

export class Engine {
    private runningState: RunningState = 'uninitialized';

    private readonly stateContext: StateContext;

    public readonly tickLoop: TickLoop;

    private readonly startMiddlewares: StackMiddleware;
    private readonly inputMiddlewares: StackMiddleware;
    private readonly tickMiddlewares: StackMiddleware;

    constructor(settings: Settings) {
        const internalGameSettings = this.validateSettings(settings);

        this.stateContext = {
            runningState: this.runningState,
            lastInput: null,
            newSettings: {},
            stateData: internalGameSettings.startState,
        };

        this.startMiddlewares = internalGameSettings.middlewares.start;
        this.inputMiddlewares = internalGameSettings.middlewares.input;
        this.tickMiddlewares = internalGameSettings.middlewares.tick;

        this.tickLoop = new TickLoop(this, this.tickMiddlewares, this.stateContext, settings.tickInterval);
    }

    public async input(input: IncomingInput) {
        this.stateContext.lastInput = input;

        await this.inputMiddlewares.handle(this.stateContext, this, this.inputMiddlewares);
        this.inputMiddlewares.reset();

        await this.tick();

        // Clear context
        this.stateContext.newSettings = {};
        this.stateContext.lastInput = null;
    }

    public async start() {
        if (this.runningState !== 'uninitialized') {
            throw new Error('Cannot start an engine more than once. Current state is : '+this.runningState);
        }

        this.runningState = 'running';

        await this.startMiddlewares.handle(this.stateContext, this, this.startMiddlewares);
        this.startMiddlewares.reset();

        this.tickLoop.start();
        await this.tick();
    }

    /**
     * During a "pause", the tick must continue, and input might also be sent.
     */
    public async pause() {
        if (this.runningState === 'stopped') {
            throw new Error('Engine cannot be paused: it is stopped.');
        }

        this.runningState = 'paused';

        await this.tick();
    }

    public async stop() {
        if (this.runningState === 'stopped') {
            throw new Error('Engine is already stopped.');
        }

        this.runningState = 'stopped';

        this.tickLoop.stop();
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

        this.stateContext.runningState = this.runningState;
        this.tickLoop.context = this.stateContext;

        // Any kind of other tick strategy will trigger a tick
        await this.tickLoop.tick();
    }

    private validateSettings(settings: Settings): InternalGameSettings {
        const tickMiddlewares = settings.middlewares?.tick ?? [];
        tickMiddlewares.unshift(...this.defaultTickMiddlewares())

        return {
            middlewares: {
                start: new StackMiddleware(settings.middlewares?.start ?? []),
                input: new StackMiddleware(settings.middlewares?.input ?? []),
                tick: new StackMiddleware(tickMiddlewares),
            },
            tickInterval: settings.tickInterval ?? DEFAULT_TICK_INTERVAL_MS,
        };
    }

    private defaultTickMiddlewares(): MiddlewareInterface[] {
        return [
            new UpdateSettingsMiddleware(),
        ];
    }
}
