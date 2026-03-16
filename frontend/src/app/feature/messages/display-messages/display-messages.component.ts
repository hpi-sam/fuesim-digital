import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, SlicePipe } from '@angular/common';
import { fade } from '../animations/fade';
import { MessageService } from '../../../core/messages/message.service';
import { CustomTimerProgressBarComponent } from '../custom-timer-progress-bar/custom-timer-progress-bar.component';
import { MessageBodyComponent } from '../message-body/message-body.component';

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
    imports: [
        CustomTimerProgressBarComponent,
        MessageBodyComponent,
        AsyncPipe,
        SlicePipe,
    ],
})
export class DisplayMessagesComponent {
    readonly messageService = inject(MessageService);
}
