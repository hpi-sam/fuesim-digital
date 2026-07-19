import {
    Component,
    inject,
    input,
    type OnInit,
    output,
    signal,
} from '@angular/core';
import {
    GetExerciseTemplatesResponseData,
    GetOrganisationDetailsResponseData,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service.js';
import { ExerciseService } from '../../../../core/exercise.service.js';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive.js';
import { HelpButtonComponent } from '../../../../help-button/help-button.component.js';
import { ExerciseTemplateCardComponent } from '../../../../shared/components/exercise-template-card/exercise-template-card.component.js';
import { httpOrigin } from '../../../../core/api-origins.js';

@Component({
    selector: 'app-organisation-tab-exercise-templates',
    imports: [
        FormsModule,
        FileInputDirective,
        HelpButtonComponent,
        ExerciseTemplateCardComponent,
    ],
    templateUrl: './organisation-tab-exercise-templates.component.html',
    styleUrl: './organisation-tab-exercise-templates.component.scss',
})
export class OrganisationTabExerciseTemplatesComponent implements OnInit {
    readonly organisation =
        input.required<GetOrganisationDetailsResponseData>();
    readonly update = output<boolean>();

    private readonly apiService = inject(ApiService);
    private readonly exerciseService = inject(ExerciseService);

    readonly exerciseTemplates = signal<
        GetExerciseTemplatesResponseData | undefined
    >(undefined);

    async createExerciseTemplate(fileList?: FileList) {
        await this.exerciseService.createExerciseTemplate(
            fileList,
            () => {
                this.reload();
                this.update.emit(true);
            },
            this.organisation().id
        );
    }

    reload() {
        this.apiService
            .getExerciseTemplates({ organisationId: this.organisation().id })
            .then((res) => {
                this.exerciseTemplates.set(res);
            });
    }
    ngOnInit() {
        this.reload();
    }

    protected readonly httpOrigin = httpOrigin;
}
