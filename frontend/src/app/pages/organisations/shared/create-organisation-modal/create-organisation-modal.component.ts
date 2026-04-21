import { Component, inject, output, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    postOrganisationRequestDataSchema,
    PostOrganisationRequestData,
} from 'fuesim-digital-shared';
import {
    form,
    FormField,
    validateStandardSchema,
} from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { DisplayModelValidationComponent } from '../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-create-organisation-modal',
    templateUrl: './create-organisation-modal.component.html',
    styleUrls: ['./create-organisation-modal.component.scss'],
    imports: [
        AutofocusDirective,
        FormField,
        DisplayModelValidationComponent,
        FormsModule,
    ],
})
export class CreateOrganisationModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);

    public readonly created = output<boolean>();
    readonly model = signal<PostOrganisationRequestData>({
        name: '',
        description: '',
    });
    form = form(this.model, (schemaPath) => {
        validateStandardSchema(schemaPath, postOrganisationRequestDataSchema);
    });

    public async create() {
        await this.apiService.createOrganisation(this.model());
        this.created.emit(true);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
