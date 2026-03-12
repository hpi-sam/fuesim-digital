import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';
import { CoordinatePickerModalComponent } from './coordinate-picker-modal/coordinate-picker-modal.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        CoordinatePickerModalComponent,
    ],
})
export class CoordinatePickerModule {}
