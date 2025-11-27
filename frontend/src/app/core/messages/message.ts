import { uuid } from 'digital-fuesim-manv-shared';
import { Subject } from 'rxjs';
import { CustomTimer } from './custom-timer';

export interface MessageConfig {
    title: string;
    body?: string;
    /**
     * The 'click'-event will be emitted over {@link event$}
     */
    button?: {
        /**
         * The text that should appear of the button. The 'click'-event will be emitted over {@link event$}
         */
        name: string;
        color:
            | 'danger'
            | 'info'
            | 'primary'
            | 'secondary'
            | 'success'
            | 'warning';
    };
    /**
     * A json-value that should be logged (e.g. for errors)
     */
    logValue?: unknown;
    /**
     * The styling of the message
     */
    color: 'danger' | 'info' | 'success' | 'warning';
}

export class Message {
    /**
     * Emits when this message gets destroyed
     */
    public destroyed$ = new Subject<void>();
    public id = uuid();
    /**
     * The number of similar messages (= same config) that have been posted
     */
    public amount = 1;
    public readonly event$ = new Subject<'click'>();
    public get destroyTimer() {
        return this._destroyTimer;
    }

    private _destroyTimer?: CustomTimer;

    /**
     * @param destroyTimeout After which time should the message automatically disappear? if null, the message will never be automatically destroyed
     */
    constructor(
        public readonly config: MessageConfig,
        destroyTimeout: number | null
    ) {
        this.setDestroyTimeout(destroyTimeout);
    }

    /**
     * Makes sure that the {@link destroyTimer} doesn't finish in the next {@link newTimeout} ms from now
     */
    public increaseDestroyTimeout(newTimeout: number | null) {
        if (!this.destroyTimer) {
            return;
        }
        if (newTimeout === null) {
            this.setDestroyTimeout(null);
            return;
        }
        const timeLeft = this.destroyTimer.getTimeLeft();
        if (newTimeout > timeLeft) {
            this.setDestroyTimeout(newTimeout);
        }
    }

    private setDestroyTimeout(timeout: number | null) {
        this._destroyTimer?.destroy();
        this._destroyTimer = undefined;
        if (timeout !== null) {
            this._destroyTimer = new CustomTimer(() => this.destroy(), timeout);
        }
    }

    public destroy() {
        this.event$.complete();
        this.destroyed$.next();
        this.destroyed$.complete();
        this.destroyTimer?.destroy();
    }
}
