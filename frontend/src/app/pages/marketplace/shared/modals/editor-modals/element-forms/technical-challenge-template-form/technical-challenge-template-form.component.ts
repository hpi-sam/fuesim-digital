import { Component, inject, input } from '@angular/core';
import { TechnicalChallengeTemplate, TaskType } from 'fuesim-digital-shared';
import { UploadTechnicalChallengeTemplateFormComponent } from '../../../../../../exercises/exercise/shared/editor-panel/upload-technical-challenge-template-form/upload-technical-challenge-template-form.component.js';
import {
    BaseVersionedElementSubmodal,
    FormOutputInjectionToken,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal.js';

@Component({
    selector: 'app-technical-challenge-template-form',
    imports: [UploadTechnicalChallengeTemplateFormComponent],
    templateUrl: './technical-challenge-template-form.component.html',
})
export class TechnicalChallengeTemplateFormComponent implements BaseVersionedElementSubmodal<TechnicalChallengeTemplate> {
    // TODO: handle difference between import /viewing
    public readonly data =
        input.required<VersionedElementModalData<TechnicalChallengeTemplate>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);
    public formOutput = inject(FormOutputInjectionToken);

    public async submit(
        technicalChallengeTemplate: TechnicalChallengeTemplate,
        additionalTasks: readonly TaskType[]
    ) {
        // TODO: how to handle tasks here?
        this.formOutput.dataSubmit(technicalChallengeTemplate);

        // TODO: add tasks to marketplace
    }
}
