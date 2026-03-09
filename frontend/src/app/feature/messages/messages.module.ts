import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CustomTimerProgressBarComponent } from './custom-timer-progress-bar/custom-timer-progress-bar.component';
import { DisplayMessagesComponent } from './display-messages/display-messages.component';
import { MessageBodyComponent } from './message-body/message-body.component';
import { AppShowMoreComponent } from './show-more/app-show-more.component';

@NgModule({
    imports: [CommonModule, SharedModule],
    declarations: [
        AppShowMoreComponent,
        DisplayMessagesComponent,
        MessageBodyComponent,
        CustomTimerProgressBarComponent,
    ],
    exports: [DisplayMessagesComponent],
})
export class MessagesModule {}
