import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Message } from '../../../core/messages/message';
import { AppShowMoreComponent } from '../show-more/app-show-more.component';

/**
 * Displays the body of a message (for a toast or alert)
 */
@Component({
    selector: 'app-message-body',
    templateUrl: './message-body.component.html',
    styleUrls: ['./message-body.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AppShowMoreComponent],
})
export class MessageBodyComponent {
    readonly message = input.required<Message>();
}
