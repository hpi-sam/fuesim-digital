import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import type { TechnicalChallengeTemplate } from 'fuesim-digital-shared';

@Component({
    selector: 'app-technical-challenge-template-form',
    templateUrl: './technical-challenge-template-form.component.html',
    styleUrls: ['./technical-challenge-template-form.component.scss'],
    imports: [FormsModule, FormField],
})
export class TechnicalChallengeTemplateFormComponent {
    public readonly technicalChallengeTemplate =
        model.required<TechnicalChallengeTemplate>();
    public readonly form = form<TechnicalChallengeTemplate>(
        this.technicalChallengeTemplate
    );
}
