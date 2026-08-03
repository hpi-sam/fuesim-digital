import {
    Component,
    computed,
    inject,
    linkedSignal,
    signal,
} from '@angular/core';
import { NgbActiveModal, type NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    technicalChallengeTemplateSchema,
    taskTypeSchema,
    TechnicalChallengeTemplate,
    TaskType,
} from 'fuesim-digital-shared';
import { z } from 'zod';
import { castImmutable } from 'immer';
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component.js';
import { FileInputDirective } from '../../../../../../shared/directives/file-input.directive.js';
import { TechnicalChallengeTemplateFormComponent } from '../technical-challenge-template-form/technical-challenge-template-form.component.js';
import type { TaskNameMap } from '../edit-state-machine-form/edit-state-machine-form.component.js';
import { ExerciseService } from '../../../../../../core/exercise.service.js';

export function openUploadTechnicalChallengeModal(ngbModal: NgbModal) {
    ngbModal.open(UploadTechnicalChallengeTemplateModalComponent, {
        size: 'lg',
    });
}

const uploadTechnicalChallengeTemplateSchema = z.strictObject({
    type: z.literal('technicalChallengeImport'),
    version: z.literal('v1'),
    technicalChallengeTemplate: technicalChallengeTemplateSchema,
    requiredTaskTypes: z.array(taskTypeSchema),
});

@Component({
    selector: 'app-upload-technical-challenge-template-modal',
    imports: [
        HelpButtonComponent,
        FileInputDirective,
        TechnicalChallengeTemplateFormComponent,
    ],
    templateUrl: './upload-technical-challenge-template-modal.component.html',
})
class UploadTechnicalChallengeTemplateModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);

    readonly uploadObject = signal<
        z.infer<typeof uploadTechnicalChallengeTemplateSchema> | undefined
    >(undefined);

    readonly uploadedTechnicalChallenge = linkedSignal<
        TechnicalChallengeTemplate | undefined
    >(() => castImmutable(this.uploadObject()?.technicalChallengeTemplate));

    readonly taskNameMap = computed<TaskNameMap>(
        () =>
            new Map(
                this.uploadObject()?.requiredTaskTypes.map((t) => [t.id, t])
            )
    );

    readonly uploadedAdditionalTasks = linkedSignal<readonly TaskType[]>(
        () => castImmutable(this.uploadObject()?.requiredTaskTypes) ?? []
    );

    public async uploadTechnicalChallengeTemplate(uploadFileList: FileList) {
        const jsonFile = uploadFileList.item(0)!;
        const jsonValue = await jsonFile.text().then(JSON.parse);

        const parsedResult =
            uploadTechnicalChallengeTemplateSchema.safeParse(jsonValue);
        if (parsedResult.error) {
            console.error(parsedResult.error.message);
            return;
        }

        this.uploadObject.set(parsedResult.data);
    }

    public async importTemplate() {
        const technicalChallengeTemplate = this.uploadedTechnicalChallenge();
        if (!technicalChallengeTemplate) return;

        const additionalTasks = this.uploadedAdditionalTasks();

        await this.exerciseService.proposeAction({
            type: '[TechnicalChallengeTemplate] Import a new template with tasks',
            technicalChallengeTemplate,
            additionalTasks,
        });
    }

    public close(): void {
        this.activeModal.close();
    }

    protected readonly alert = alert;
}
