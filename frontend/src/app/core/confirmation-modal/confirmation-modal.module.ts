import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConfirmationModalComponent } from './confirmation-modal.component';

@NgModule({
    declarations: [ConfirmationModalComponent],
    imports: [CommonModule, FormsModule, SharedModule],
})
export class ConfirmationModalModule {}
