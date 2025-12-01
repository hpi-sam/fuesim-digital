import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { HospitalEditorModalComponent } from './hospital-editor-modal/hospital-editor-modal.component';

@NgModule({
    declarations: [HospitalEditorModalComponent],
    imports: [CommonModule, SharedModule, FormsModule, NgbDropdownModule],
})
export class HospitalEditorModule {}
