import { Component, input, inject } from '@angular/core';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-copy-button',
    templateUrl: './copy-button.component.html',
    styleUrls: ['./copy-button.component.scss'],
    standalone: false,
})
export class CopyButtonComponent {
    private readonly messageService = inject(MessageService);

    readonly value = input<string>('');

    copy() {
        navigator.clipboard.writeText(this.value());

        this.messageService.postMessage({
            title: 'Link wurde in die Zwischenablage kopiert',
            color: 'info',
        });
    }
}
