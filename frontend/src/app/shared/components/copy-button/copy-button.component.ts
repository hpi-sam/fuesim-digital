import { Component, input, inject } from '@angular/core';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: '[app-copy-button]',
    templateUrl: './copy-button.component.html',
    styleUrls: ['./copy-button.component.scss'],
    host: {
        '(click)': 'copy()',
        type: 'button',
    },
})
export class CopyButtonComponent {
    private readonly messageService = inject(MessageService);

    readonly value = input<string>('');
    readonly icon = input<string>('copy');

    copy() {
        navigator.clipboard.writeText(this.value());

        this.messageService.postMessage({
            title: 'Link wurde in die Zwischenablage kopiert',
            color: 'info',
        });
    }
}
