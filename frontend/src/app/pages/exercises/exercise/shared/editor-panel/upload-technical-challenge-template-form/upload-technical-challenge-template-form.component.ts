import { Component, inject, linkedSignal, output, signal } from '@angular/core';
import {
    technicalChallengeTemplateSchema,
    type TechnicalChallengeTemplate,
} from 'fuesim-digital-shared';
import { castImmutable } from 'immer';
import { z } from 'zod';
import { MessageService } from '../../../../../../core/messages/message.service.js';
import { FileInputDirective } from '../../../../../../shared/directives/file-input.directive.js';
import { TechnicalChallengeTemplateFormComponent } from '../technical-challenge-template-form/technical-challenge-template-form.component.js';

const uploadTechnicalChallengeTemplateSchema = z.strictObject({
    type: z.literal('technicalChallengeImport'),
    version: z.literal('v1.1'),
    technicalChallengeTemplate: technicalChallengeTemplateSchema,
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

    public async uploadTechnicalChallengeTemplate(uploadFileList: FileList) {
        const jsonFile = uploadFileList.item(0)!;
        const jsonValue = await jsonFile.text().then(JSON.parse);

        const parsedResult =
            uploadTechnicalChallengeTemplateSchema.safeParse(jsonValue);
        if (parsedResult.error) {
            console.error(parsedResult.error.message);

            this.messageService.postMessage({
                title: 'Die Datei hat das falsche Format.',
                body: `Stellen Sie sicher, dass die Datei mit einer kompatiblen Version der Editorsoftware erstellt wurde. Erwartetes Format: ${uploadTechnicalChallengeTemplateSchema.shape.version.value}`,
                color: 'danger',
            });
            return;
        }

        this.uploadObject.set(parsedResult.data);
    }

    readonly outputTemplate = output<{
        technicalChallengeTemplate: TechnicalChallengeTemplate;
    }>();

    public async importTemplate() {
        const technicalChallengeTemplate = this.uploadedTechnicalChallenge();
        if (!technicalChallengeTemplate) return;

        this.outputTemplate.emit({
            technicalChallengeTemplate,
        });
    }
}
