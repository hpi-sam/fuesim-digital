import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Message } from 'src/app/core/messages/message';

/**
 * Displays the body of a message (for a toast or alert)
 */
@Component({
    selector: 'app-message-body',
    templateUrl: './message-body.component.html',
    styleUrls: ['./message-body.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class MessageBodyComponent {
    @Input() message!: Message;
}
