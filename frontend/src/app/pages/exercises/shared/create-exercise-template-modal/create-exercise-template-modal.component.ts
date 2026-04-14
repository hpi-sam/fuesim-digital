import { output, signal, Component, inject, effect } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
    GetOrganisationsResponseDataSchema,
    OrganisationId,
    PostExerciseTemplateRequestData,
    postExerciseTemplateRequestDataSchema,
} from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import {
    disabled,
    form,
    FormField,
    validateStandardSchema,
} from '@angular/forms/signals';
import { ApiService } from '../../../../core/api.service';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { DisplayModelValidationComponent } from '../../../../shared/validation/display-model-validation/display-model-validation.component.js';
import { AuthService } from '../../../../core/auth.service.js';

@Component({
    selector: 'app-create-exercise-template-modal',
    templateUrl: './create-exercise-template-modal.component.html',
    styleUrls: ['./create-exercise-template-modal.component.scss'],
    imports: [
        FormsModule,
        AutofocusDirective,
        DisplayValidationComponent,
        DisplayModelValidationComponent,
        FormField,
    ],
})
export class CreateExerciseTemplateModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly authService = inject(AuthService);

    readonly created = output<boolean>();

    readonly model = signal<PostExerciseTemplateRequestData>({
        name: '',
        description: '',
        organisationId: '' as OrganisationId,
    });
    readonly exerciseTemplateForm = form(this.model, (schemaPath) => {
        disabled(schemaPath.organisationId, () =>
            this.organisations.isLoading()
        );
        validateStandardSchema(
            schemaPath,
            postExerciseTemplateRequestDataSchema
        );
    });

    organisations: HttpResourceRef<
        GetOrganisationsResponseDataSchema | undefined
    >;

    constructor() {
        this.organisations = this.apiService.getOrganisationsAsEditorResource();
        effect(() => {
            const orgs = this.organisations.value();
            if (orgs && !this.model().organisationId) {
                const userId = this.authService.authData().user!.id;
                const userOrg = orgs.find(
                    (org) => org.personalOrganisationOf === userId
                );
                this.model.set({
                    ...this.model(),
                    organisationId: userOrg?.id ?? ('' as OrganisationId),
                });
            }
        });
    }

    public async createExerciseTemplate() {
        await this.apiService.createExerciseTemplate(this.model());
        this.created.emit(true);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
