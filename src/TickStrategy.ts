export interface TickStrategy {
    willTick(): boolean;
}

export class CallbackTickStrategy implements TickStrategy
{
    private readonly callback: () => boolean;

    constructor(callback: () => boolean) {
        this.callback = callback;
    }

    willTick(): boolean {
        return this.callback();
    }
}
