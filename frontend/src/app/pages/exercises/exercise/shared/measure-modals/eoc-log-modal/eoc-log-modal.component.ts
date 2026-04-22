import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
    form,
    validateStandardSchema,
    FormField,
} from '@angular/forms/signals';
import { z } from 'zod';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { DisplayModelValidationComponent } from '../../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-eoc-log-entry-modal',
    templateUrl: './eoc-log-modal.component.html',
    styleUrls: ['./eoc-log-modal.component.scss'],
    imports: [
        FormsModule,
        AutofocusDirective,
        FormField,
        DisplayModelValidationComponent,
    ],
})
export class EocLogModalComponent {
    activeModal = inject(NgbActiveModal);

    public readonly editable = signal<boolean>(true);

    public readonly values = signal({
        message: '',
    });
    public readonly eocLogForm = form(this.values, (schemaPath) => {
        validateStandardSchema(
            schemaPath.message,
            z
                .string()
                .min(1, { error: 'Der Text darf nicht leer sein' })
                .max(65535, { error: 'Der Text ist zu lang' })
        );
    });

    public initialize(message: string | null, editable: boolean = true) {
        if (message) {
            this.values.set({ message });
        }
        this.editable.set(editable);
    }

    public confirm() {
        this.activeModal.close({
            message: this.values().message,
        });
    }

    public cancel() {
        this.activeModal.dismiss();
    }
}
