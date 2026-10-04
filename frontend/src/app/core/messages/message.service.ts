import { Injectable, signal } from '@angular/core';
import type { UUID } from 'fuesim-digital-shared';
import type { MessageConfig } from './message';
import { Message } from './message';

@Injectable({ providedIn: 'root' })
export class MessageService {
    /**
     * A list of messages that should be displayed as toast
     * the newest message is at the end of the array
     */
    public readonly messages = signal<Message[]>([]);
    private readonly defaultTimeout = 5 * 1000;

    /**
     * A shortcut to display errors to the user and log them to the console
     *
     * @param param0 the error message that should be posted, multiple similar messages get stacked
     * @param type `toasts` are small messages displayed at the top-right, `alerts` are very prominently displayed at the bottom-center
     * @param timeout After which time should the message automatically disappear? (The message can always be closed manually by the user)
     * null: never
     * number: after ... ms
     * -> the highest timeout always wins in stacked messages
     * @returns the message-object that got created
     */
    public postError(
        {
            title,
            body,
            error,
        }: {
            title: string;
            body?: string;
            error?: any;
        },
        timeout: number | null = this.defaultTimeout
    ) {
        if (error) {
            console.error(error);
        }
        return this.postMessage(
            {
                title,
                body,
                color: 'danger',
            },
            timeout
        );
    }

    /**
     * @param config the message that should be posted, multiple similar messages get stacked
     * @param timeout After which time should the message automatically disappear? (The message can always be closed manually by the user)
     * null: never
     * number: after ... ms
     * @returns the message-object that got created
     */
    public postMessage(
        config: MessageConfig,
        timeout: number | null = this.defaultTimeout
    ): Message {
        const message = new Message(config, timeout, () => {
            this.removeDestroyedMessage(message.id);
        });

        this.messages.set([...this.messages(), message]);
        return message;
    }

    /**
     * Removes a destroyed message from the list of messages
     */
    private removeDestroyedMessage(id: UUID) {
        const messages = this.messages();
        const index = messages.findIndex((message) => message.id === id);
        if (index < 0) {
            console.error(`Cannot remove message ${id} - Unknown id!`);
            return;
        }
        messages.splice(index, 1);
        this.messages.set(messages);
    }
}
