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
    GetExerciseResponseData,
    GetOrganisationsResponseData,
    OrganisationId,
    postExerciseRequestDataSchema,
} from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import {
    disabled,
    form,
    FormField,
    validateStandardSchema,
} from '@angular/forms/signals';
import { ApiService } from '../../../../core/api.service';
import { DisplayModelValidationComponent } from '../../../../shared/validation/display-model-validation/display-model-validation.component.js';
import { AuthService } from '../../../../core/auth.service.js';
import { MessageService } from '../../../../core/messages/message.service.js';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive.js';
import { ExerciseService } from '../../../../core/exercise.service.js';

@Component({
    selector: 'app-create-exercise-modal',
    templateUrl: './create-exercise-modal.component.html',
    styleUrls: ['./create-exercise-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        FormsModule,
        DisplayModelValidationComponent,
        FormField,
        FileInputDirective,
    ],
})
export class CreateExerciseModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly authService = inject(AuthService);
    private readonly messageService = inject(MessageService);
    private readonly exerciseService = inject(ExerciseService);

    readonly created = output<GetExerciseResponseData>();

    readonly model = signal<{
        organisationId: OrganisationId;
        importObject: any;
    }>({
        organisationId: '' as OrganisationId,
        importObject: undefined,
    });
    readonly importFileName = signal<string | null>(null);
    readonly organisationLocked = signal<boolean>(false);

    readonly exerciseForm = form(this.model, (schemaPath) => {
        disabled(
            schemaPath.organisationId,
            () => this.organisations.isLoading() || this.organisationLocked()
        );
        validateStandardSchema(schemaPath, postExerciseRequestDataSchema);
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

    public async importFile(fileList: FileList | object) {
        const result = await this.exerciseService.importExercise(fileList);
        if (!result) return;
        this.importFileName.set(result.fileName);
        this.model.set({
            ...this.model(),
            importObject: result.importObject,
        });
    }

    public async createExercise() {
        const exerciseKeys = await this.apiService.createExercise(this.model());
        this.created.emit(exerciseKeys);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }
}
