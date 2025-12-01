import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { CustomTimerProgressBarComponent } from './custom-timer-progress-bar/custom-timer-progress-bar.component';
import { DisplayMessagesComponent } from './display-messages/display-messages.component';
import { LogToStringPipe } from './log-to-string/log-to-string.pipe';
import { MessageBodyComponent } from './message-body/message-body.component';
import { AppShowMoreComponent } from './show-more/app-show-more.component';

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
