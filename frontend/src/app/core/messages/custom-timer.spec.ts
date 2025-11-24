import { CustomTimer } from './custom-timer.js';

describe('CustomTimer', () => {
    jest.useFakeTimers();

    let timer!: CustomTimer;

    afterEach(() => {
        timer.destroy();
    });

    it('calls the callback after the time is over', () => {
        const time = 1000;
        const callback = jest.fn();
        timer = new CustomTimer(callback, time);
        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(time - 1);
        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(time);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('correctly returns the timeLeft', () => {
        const time = 2000;
        timer = new CustomTimer(() => 1, time);
        // running
        expect(timer.getTimeLeft()).toEqual(time);
        jest.advanceTimersByTime(1000);
        expect(timer.getTimeLeft()).toEqual(time - 1000);
        timer.pause();
        // paused
        expect(timer.getTimeLeft()).toEqual(time - 1000);
        jest.advanceTimersByTime(1000);
        expect(timer.getTimeLeft()).toEqual(time - 1000);
        timer.start();
        // running
        jest.advanceTimersByTime(1000);
        expect(timer.getTimeLeft()).toEqual(0);
        jest.advanceTimersByTime(1000);
        expect(timer.getTimeLeft()).toEqual(0);
    });
});
