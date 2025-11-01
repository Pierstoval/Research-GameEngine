import type {IncomingInput, RunningState} from "./Engine.ts";
import {Engine} from "./Engine.ts";

export interface MiddlewareInterface {
    handle(context: StateContext, engine: Engine, stack: MiddlewareInterface): Promise<void>;
}

export type StateContext = {
    runningState: RunningState;
    lastInput: IncomingInput;
    stateData: Record<string, unknown>;
    newSettings: Record<string, unknown>;
}

export class StackMiddleware implements MiddlewareInterface {
    private readonly middlewares: Array<MiddlewareInterface> = [];
    private offset: number = 0;

    constructor(stack: Array<MiddlewareInterface>|MiddlewareInterface|null) {
        if (Array.isArray(stack)) {
            this.middlewares = stack;
        } else if (stack) {
            this.middlewares = [stack];
        }
    }

    reset() {
        this.offset = 0;
    }

    handle(context: StateContext, engine: Engine, stack: MiddlewareInterface): Promise<void> {
        return this.middlewares.reduce(
            (cur, middleware) => cur.then(() => middleware.handle(context, engine, stack)),
            Promise.resolve()
        );
    }
}

export class CallbackMiddleware implements MiddlewareInterface {
    private readonly callback: (context: StateContext, engine: Engine, stack: MiddlewareInterface) => unknown;

    constructor(callback: (context: StateContext, engine: Engine, stack: MiddlewareInterface) => unknown) {
        this.callback = callback;
    }

    handle(context: StateContext, engine: Engine, stack: MiddlewareInterface): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const result = this.callback(context, engine, stack);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        })
    }

}

export class UpdateSettingsMiddleware implements MiddlewareInterface {
    handle(context: StateContext, engine: Engine, stack: MiddlewareInterface): Promise<void> {
        Object.entries(context.newSettings).forEach(([key, value]) => {
            if (key === 'tickInterval' && !isNaN(value)) {
                engine.tickLoop.updateInterval(Number(value))
            }
        })

        return Promise.resolve();
    }
}
