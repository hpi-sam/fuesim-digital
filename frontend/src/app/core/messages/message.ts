import { uuid } from 'fuesim-digital-shared';
import { signal, type WritableSignal } from '@angular/core';

export interface MessageConfig {
    title: string;
    body?: string;
    button?: {
        /**
         * The text that should appear on the button.
         */
        name: string;
        color:
            | 'danger'
            | 'info'
            | 'primary'
            | 'secondary'
            | 'success'
            | 'warning';
        action: () => void;
    };
    /**
     * The styling of the message
     */
    color: 'danger' | 'info' | 'success' | 'warning';
}

export class Message {
    public id = uuid();

    readonly timeout: WritableSignal<number | null>;
    readonly paused = signal<boolean>(false);

    /**
     * @param config Config of the message
     * @param timeout After which time should the message automatically disappear? if null, the message will never be automatically destroyed
     * @param destroyCallback Called when this message should be destroyed
     */
    constructor(
        public readonly config: MessageConfig,
        timeout: number | null,
        private readonly destroyCallback: () => void
    ) {
        this.timeout = signal<number | null>(timeout);
    }

    public destroy() {
        this.destroyCallback();
    }
}
