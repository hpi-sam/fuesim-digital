import { Component, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-copy-button',
    templateUrl: './copy-button.component.html',
    styleUrls: ['./copy-button.component.scss'],
    standalone: false,
})
export class CopyButtonComponent {
    value = input<string>('');

    constructor(private readonly messageService: MessageService) {}

    copy() {
        navigator.clipboard.writeText(this.value());

        this.messageService.postMessage({
            title: 'Link wurde in die Zwischenablage kopiert',
            color: 'info',
        });
    }
}
