import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { uuid } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import { AppState } from 'src/app/state/app.state';
import { selectOperationalSections } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-operational-sections-tab',
    standalone: false,
    templateUrl: './operational-sections.component.html',
    styleUrl: './operational-sections.component.scss',
})
export class OperationalSectionsTabComponent {
    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    public readonly operationalSections$ = this.store
        .select(selectOperationalSections)
        .pipe(map((sectionsMap) => Object.values(sectionsMap)));

    public addOperationalSection(): void {
        this.exerciseService.proposeAction({
            type: '[OperationalSection] Add Operational Section',
            sectionId: uuid(),
            title: 'Einsatzabschnitt ???',
        });
    }
}
