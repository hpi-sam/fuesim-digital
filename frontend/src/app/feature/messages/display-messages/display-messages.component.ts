import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MessageService } from 'src/app/core/messages/message.service';
import { fade } from '../animations/fade';

/**
 * This component displays all the messages from the MessageService.
 * It can be used multiple times in the application. The only case this could ba a wanted behaviour is,
 * if an element goes into fullscreen mode and the messages should still be visible.
 * The toasts and alerts are positioned independently from the occurrence of the component absolute to the viewport.
 * - The alerts are displayed in the center bottom and the toasts on the top right.
 */
@Component({
    selector: 'app-display-messages',
    templateUrl: './display-messages.component.html',
    styleUrls: ['./display-messages.component.scss'],
    animations: [fade()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class DisplayMessagesComponent {
    constructor(public readonly messageService: MessageService) {}
}
