import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { CustomTimerProgressBarComponent } from './custom-timer-progress-bar/custom-timer-progress-bar.component.js';
import { DisplayMessagesComponent } from './display-messages/display-messages.component.js';
import { LogToStringPipe } from './log-to-string/log-to-string.pipe.js';
import { MessageBodyComponent } from './message-body/message-body.component.js';
import { AppShowMoreComponent } from './show-more/app-show-more.component.js';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [
        AppShowMoreComponent,
        DisplayMessagesComponent,
        MessageBodyComponent,
        CustomTimerProgressBarComponent,
        LogToStringPipe,
    ],
    exports: [DisplayMessagesComponent],
})
export class MessagesModule {}
