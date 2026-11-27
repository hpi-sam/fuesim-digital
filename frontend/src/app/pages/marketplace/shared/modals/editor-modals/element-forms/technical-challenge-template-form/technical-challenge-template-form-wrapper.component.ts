import { Component, inject, input } from '@angular/core';
import { TechnicalChallengeTemplate } from 'fuesim-digital-shared';
import { form } from '@angular/forms/signals';
import { UploadTechnicalChallengeTemplateFormComponent } from '../../../../../../exercises/exercise/shared/editor-panel/upload-technical-challenge-template-form/upload-technical-challenge-template-form.component.js';
import {
    BaseVersionedElementSubmodal,
    FormOutputInjectionToken,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal.js';
import { TechnicalChallengeTemplateFormComponent } from '../../../../../../exercises/exercise/shared/editor-panel/technical-challenge-template-form/technical-challenge-template-form.component.js';
import { MarketplaceFormSubmitButtonBarComponent } from '../../submit-button-bar/submit-button-bar.component.js';

@Component({
    selector: 'app-technical-challenge-template-form-wrapper',
    imports: [
        UploadTechnicalChallengeTemplateFormComponent,
        TechnicalChallengeTemplateFormComponent,
        MarketplaceFormSubmitButtonBarComponent,
    ],
    templateUrl: './technical-challenge-template-form-wrapper.component.html',
})
export class TechnicalChallengeTemplateFormWrapperComponent implements BaseVersionedElementSubmodal<TechnicalChallengeTemplate> {
    public readonly data =
        input.required<VersionedElementModalData<TechnicalChallengeTemplate>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);
    public formOutput = inject(FormOutputInjectionToken);

    public async submit(
        technicalChallengeTemplate: TechnicalChallengeTemplate
    ) {
        // TODO@Felix: Qualifications?
        this.formOutput.dataSubmit(technicalChallengeTemplate);
    }

    protected readonly form = form;
}
