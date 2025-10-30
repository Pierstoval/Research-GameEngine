import type {Engine, IncomingInput} from "./Engine";

export interface MiddlewareInterface {
    handle(context: MiddlewareContext, stack: MiddlewareInterface): Promise<void>;
}

export interface MiddlewareStackInterface {
    next(): MiddlewareInterface;
}

export type MiddlewareContext = {
    engine: Engine;
    lastInput: IncomingInput;
    stateData: Record<string, unknown>;
}

export class StackMiddleware implements MiddlewareInterface, MiddlewareStackInterface {
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

    handle(context: MiddlewareContext, stack: MiddlewareInterface): Promise<void> {
        const next = this.next();

        if (!next) {
            return Promise.resolve();
        }

        this.offset++;

        return next.handle(context, stack);
    }

    next(): MiddlewareInterface {
        return this.middlewares[this.offset] ?? null;
    }
}

export class CallbackMiddleware implements MiddlewareInterface {
    private readonly callback: (context: MiddlewareContext, stack: MiddlewareInterface) => unknown;

    constructor(callback: (context: MiddlewareContext, stack: MiddlewareInterface) => unknown) {
        this.callback = callback;
    }

    handle(context: MiddlewareContext, stack: MiddlewareInterface): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const result = this.callback(context, stack);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        })
    }

}
