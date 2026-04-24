import { sleep } from 'fuesim-digital-shared';
import { PeriodicEventHandler } from './periodic-event-handler.js';

describe('Periodic Event Handler', () => {
    it('correctly aborts async ticks', async () => {
        let startCallCounter = 0;
        let endCallCounter = 0;
        const waitDuration = 10;
        const tick = async () => {
            startCallCounter++;
            await sleep(waitDuration);
            endCallCounter++;
        };

        const tickInterval = 30;
        const tickHandler = new PeriodicEventHandler(tick, tickInterval);

        tickHandler.start();
        await sleep(tickInterval * 2.1);
        tickHandler.pause();

        // Wait to prevent test from finishing too early
        await sleep(waitDuration + 5);

        expect(startCallCounter).toBe(2);
        expect(endCallCounter).toBe(2);
    });
});
