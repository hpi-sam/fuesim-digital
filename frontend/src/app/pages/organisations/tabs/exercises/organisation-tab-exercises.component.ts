import {
    Component,
    inject,
    input,
    type OnInit,
    output,
    signal,
} from '@angular/core';
import {
    GetExercisesResponseData,
    GetOrganisationDetailsResponseData,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service.js';
import { ExerciseService } from '../../../../core/exercise.service.js';
import { ExerciseCardComponent } from '../../../../shared/components/exercise-card/exercise-card.component.js';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive.js';
import { HelpButtonComponent } from '../../../../help-button/help-button.component.js';

@Component({
    selector: 'app-organisation-tab-exercises',
    imports: [
        FormsModule,
        ExerciseCardComponent,
        FileInputDirective,
        HelpButtonComponent,
    ],
    templateUrl: './organisation-tab-exercises.component.html',
    styleUrl: './organisation-tab-exercises.component.scss',
})
export class OrganisationTabExercisesComponent implements OnInit {
    readonly organisation =
        input.required<GetOrganisationDetailsResponseData>();
    readonly update = output<boolean>();

    private readonly apiService = inject(ApiService);
    private readonly exerciseService = inject(ExerciseService);

    readonly exercises = signal<GetExercisesResponseData | undefined>(
        undefined
    );

    async createExercise(fileList?: FileList) {
        await this.exerciseService.createExercise(
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
            .getExercises({ organisationId: this.organisation().id })
            .then((res) => {
                this.exercises.set(res);
            });
    }
    ngOnInit() {
        this.reload();
    }
}
