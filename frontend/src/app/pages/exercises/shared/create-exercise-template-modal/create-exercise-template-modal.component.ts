import { output, signal, Component, inject, effect } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import {
    ExportImportFile,
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
import { MessageService } from '../../../../core/messages/message.service.js';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive.js';

@Component({
    selector: 'app-create-exercise-template-modal',
    templateUrl: './create-exercise-template-modal.component.html',
    styleUrls: ['./create-exercise-template-modal.component.scss'],
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
    private readonly messageService = inject(MessageService);

    readonly created = output<boolean>();

    readonly model = signal<PostExerciseTemplateRequestData>({
        name: '',
        description: '',
        organisationId: '' as OrganisationId,
        importObject: undefined,
    });
    readonly importFileName = signal<string | null>(null);
    readonly exerciseTemplateForm = form(this.model, (schemaPath) => {
        disabled(schemaPath.organisationId, () =>
            this.organisations.isLoading()
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

    public async importFile(fileList: FileList) {
        try {
            const file = fileList.item(0);
            if (!file) return;
            const importString = await file.text();
            const importPlain = JSON.parse(importString) as ExportImportFile;
            const type = importPlain.type;
            if (type !== 'complete') {
                this.messageService.postMessage({
                    color: 'danger',
                    title: 'Unerlaubter Importtyp',
                    body: 'Nur vollständige Übungsexporte können als neue Vorlage importiert werden.',
                });
                return;
            }
            this.importFileName.set(file.name);
            this.model.set({
                ...this.model(),
                importObject: importPlain,
            });
        } catch (error: unknown) {
            this.messageService.postError({
                title: 'Fehler beim Importieren',
                error,
            });
        }
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
