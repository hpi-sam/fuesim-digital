import {
    Component,
    inject,
    input,
    type OnInit,
    output,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    GetOrganisationDetailsResponseData,
    GetParallelExercisesResponseData,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service.js';
import { ExerciseService } from '../../../../core/exercise.service.js';
import { ParallelExerciseCardComponent } from '../../../../shared/components/parallel-exercise-card/parallel-exercise-card.component.js';

@Component({
    selector: 'app-organisation-tab-parallel-exercises',
    imports: [FormsModule, ParallelExerciseCardComponent],
    templateUrl: './organisation-tab-parallel-exercises.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './organisation-tab-parallel-exercises.component.scss',
})
export class OrganisationTabParallelExercisesComponent implements OnInit {
    readonly organisation =
        input.required<GetOrganisationDetailsResponseData>();
    readonly update = output<boolean>();

    private readonly apiService = inject(ApiService);
    private readonly exerciseService = inject(ExerciseService);

    readonly parallelExercises = signal<
        GetParallelExercisesResponseData | undefined
    >(undefined);

    reload() {
        this.apiService
            .getParallelExercises({ organisationId: this.organisation().id })
            .then((res) => {
                this.parallelExercises.set(res);
            });
    }
    ngOnInit() {
        this.reload();
    }
}
