import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { CoordinatePickerModalComponent } from './coordinate-picker-modal/coordinate-picker-modal.component';

@NgModule({
    declarations: [CoordinatePickerModalComponent],
    imports: [CommonModule, FormsModule, SharedModule],
})
export class CoordinatePickerModule {}
