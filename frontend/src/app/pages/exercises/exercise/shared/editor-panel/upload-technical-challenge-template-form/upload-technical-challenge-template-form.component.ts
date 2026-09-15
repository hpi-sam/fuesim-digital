import {
    Component,
    computed,
    inject,
    linkedSignal,
    output,
    signal,
} from '@angular/core';
import {
    technicalChallengeTemplateSchema,
    taskTypeSchema,
    type TechnicalChallengeTemplate,
    type TaskType,
} from 'fuesim-digital-shared';
import { castImmutable } from 'immer';
import { z } from 'zod';
import { MessageService } from '../../../../../../core/messages/message.service.js';
import type { TaskNameMap } from '../edit-state-machine-form/edit-state-machine-form.component.js';
import { FileInputDirective } from '../../../../../../shared/directives/file-input.directive.js';
import { TechnicalChallengeTemplateFormComponent } from '../technical-challenge-template-form/technical-challenge-template-form.component.js';

const uploadTechnicalChallengeTemplateSchema = z.strictObject({
    type: z.literal('technicalChallengeImport'),
    version: z.literal('v1'),
    technicalChallengeTemplate: technicalChallengeTemplateSchema,
    requiredTaskTypes: z.array(taskTypeSchema),
});

@Component({
    selector: 'app-upload-technical-challenge-template-form',
    imports: [FileInputDirective, TechnicalChallengeTemplateFormComponent],
    templateUrl: './upload-technical-challenge-template-form.component.html',
})
export class UploadTechnicalChallengeTemplateFormComponent {
    private readonly messageService = inject(MessageService);

    private readonly uploadObject = signal<
        z.infer<typeof uploadTechnicalChallengeTemplateSchema> | undefined
    >(undefined);

    protected readonly uploadedTechnicalChallenge = linkedSignal<
        TechnicalChallengeTemplate | undefined
    >(() => castImmutable(this.uploadObject()?.technicalChallengeTemplate));

    protected readonly taskNameMap = computed<TaskNameMap>(
        () =>
            new Map(
                this.uploadObject()?.requiredTaskTypes.map((t) => [t.id, t])
            )
    );

    protected readonly uploadedAdditionalTasks = linkedSignal<
        readonly TaskType[]
    >(() => castImmutable(this.uploadObject()?.requiredTaskTypes) ?? []);

    public async uploadTechnicalChallengeTemplate(uploadFileList: FileList) {
        const jsonFile = uploadFileList.item(0)!;
        const jsonValue = await jsonFile.text().then(JSON.parse);

        const parsedResult =
            uploadTechnicalChallengeTemplateSchema.safeParse(jsonValue);
        if (parsedResult.error) {
            console.error(parsedResult.error.message);
            this.messageService.postMessage({
                title: 'Die Datei hat das falsche Format.',
                body: z.prettifyError(parsedResult.error),
                color: 'danger',
            });
            return;
        }

        this.uploadObject.set(parsedResult.data);
    }

    readonly outputTemplate = output<{
        technicalChallengeTemplate: TechnicalChallengeTemplate;
        additionalTasks: readonly TaskType[];
    }>();

    public async importTemplate() {
        const technicalChallengeTemplate = this.uploadedTechnicalChallenge();
        if (!technicalChallengeTemplate) return;

        const additionalTasks = this.uploadedAdditionalTasks();

        this.outputTemplate.emit({
            technicalChallengeTemplate,
            additionalTasks,
        });
    }
}
