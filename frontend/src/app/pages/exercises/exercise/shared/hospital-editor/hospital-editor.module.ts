import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../../../../../shared/shared.module';
import { HospitalEditorModalComponent } from './hospital-editor-modal/hospital-editor-modal.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        NgbDropdownModule,
        HospitalEditorModalComponent,
    ],
})
export class HospitalEditorModule {}
