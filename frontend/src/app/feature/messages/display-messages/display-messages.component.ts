import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MessageService } from '../../../core/messages/message.service';
import { CustomTimerProgressBarComponent } from '../custom-timer-progress-bar/custom-timer-progress-bar.component';
import { MessageBodyComponent } from '../message-body/message-body.component';

/**
 * This component displays all the messages from the MessageService.
 * It can be used multiple times in the application. The only case this could be a wanted behaviour is,
 * if an element goes into fullscreen mode and the messages should still be visible.
 * The toasts and alerts are positioned independently of the occurrence of the component fixed to the viewport.
 * - The alerts are displayed in the center bottom and the toasts on the top right.
 */
@Component({
    selector: 'app-display-messages',
    templateUrl: './display-messages.component.html',
    styleUrls: ['./display-messages.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CustomTimerProgressBarComponent, MessageBodyComponent, SlicePipe],
})
export class DisplayMessagesComponent {
    readonly messageService = inject(MessageService);
}
