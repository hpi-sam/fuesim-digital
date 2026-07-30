import {
    output,
    signal,
    Component,
    inject,
    effect,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
    GetExerciseTemplateResponseData,
    GetOrganisationsResponseData,
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
import { DisplayModelValidationComponent } from '../../../../shared/validation/display-model-validation/display-model-validation.component.js';
import { AuthService } from '../../../../core/auth.service.js';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive.js';
import { ExerciseService } from '../../../../core/exercise.service.js';

@Component({
    selector: 'app-create-exercise-template-modal',
    templateUrl: './create-exercise-template-modal.component.html',
    styleUrls: ['./create-exercise-template-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        FormsModule,
        AutofocusDirective,
        DisplayModelValidationComponent,
        FormField,
        FileInputDirective,
    ],
})
export class CreateExerciseTemplateModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly authService = inject(AuthService);
    private readonly exerciseService = inject(ExerciseService);

    readonly created = output<GetExerciseTemplateResponseData>();

    readonly model = signal<PostExerciseTemplateRequestData>({
        name: '',
        description: '',
        organisationId: '' as OrganisationId,
        importObject: undefined,
    });
    readonly importFileName = signal<string | null>(null);
    readonly organisationLocked = signal<boolean>(false);

    readonly exerciseTemplateForm = form(this.model, (schemaPath) => {
        disabled(
            schemaPath.organisationId,
            () => this.organisations.isLoading() || this.organisationLocked()
        );
        validateStandardSchema(
            schemaPath,
            postExerciseTemplateRequestDataSchema
        );
    });

    organisations: HttpResourceRef<GetOrganisationsResponseData | undefined>;

    constructor() {
        this.organisations = this.apiService.getOrganisationsAsEditorResource();
        effect(() => {
            const orgs = this.organisations.value();
            if (orgs?.length && !this.model().organisationId) {
                const userId = this.authService.authData().user!.id;
                const userOrg = orgs.find(
                    (org) => org.personalOrganisationOf === userId
                );
                if (userOrg) {
                    this.model.set({
                        ...this.model(),
                        organisationId: userOrg.id,
                    });
                }
            }
        });
    }

    public setOrganisation(organisationId: OrganisationId) {
        this.model.set({ ...this.model(), organisationId });
        this.organisationLocked.set(true);
    }

    public async importFile(fileList: FileList) {
        const result = await this.exerciseService.importExercise(fileList);
        if (!result) return;
        this.importFileName.set(result.fileName);
        this.model.set({
            ...this.model(),
            importObject: result.importObject,
        });
    }

    public async createExerciseTemplate() {
        const template = await this.apiService.createExerciseTemplate(
            this.model()
        );
        this.created.emit(template);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
