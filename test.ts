import {Engine, CallbackTickStrategy, CallbackMiddleware} from './index.ts';

const players = [
    {id: 1, name: 'John'},
    {id: 2, name: 'Jane'},
]

const engine = new Engine({
    tickStrategy: new CallbackTickStrategy(function () {
        return true;
    }),
    middlewares: {
        start: [
            new CallbackMiddleware(() => console.info('[middlewares.start] Started!')),
        ],
        input: [
            new CallbackMiddleware((context) => {
                console.info('[middlewares.input] Received input:', context.lastInput);
            }),
        ],
        tick: [
            new CallbackMiddleware(() => console.info('[middlewares.tick] Ticking middleware!')),
        ],
    }
});

engine.start()
    .then(async () => {
        console.info('Game started!');
        await engine.input('1');
        await new Promise(resolve => setTimeout(resolve, 100));
        await engine.input('2');
        await new Promise(resolve => setTimeout(resolve, 200));
        await engine.input('3');
        await new Promise(resolve => setTimeout(resolve, 300));
        await engine.input('4');
        await engine.input('5');
        await engine.pause();
        await engine.input('6');
        await engine.input('7');
        await engine.resume();
        await engine.input('8');
        await engine.stop();
    })
;
