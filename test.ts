import {Engine, CallbackMiddleware} from './index.ts';

let tickIntervalMs = 1000;

const engine = new Engine({
    tickInterval: tickIntervalMs,
    middlewares: {
        start: [],
        input: [
            new CallbackMiddleware(async (context, engine) => {
                console.info('⌨ Received input:', JSON.stringify(context.lastInput));
                const input = context.lastInput;
                if (input['key']) {
                    const key = input['key'];
                    if (key === '+') {
                        tickIntervalMs += 100;
                        context.newSettings.tickInterval = tickIntervalMs;
                    } else if (key === '-') {
                        tickIntervalMs -= 100;
                        context.newSettings.tickInterval = tickIntervalMs;
                    } else if (key === "\u0003") {
                        await engine.stop();
                    }
                }
            }),
        ],
        tick: [
            new CallbackMiddleware(() => console.info('⏲  Ticking every '+tickIntervalMs+'ms')),
        ],
    }
});

engine.start().then(async () => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on( 'data', function(key){
        engine.input({key: key});
    });
});
