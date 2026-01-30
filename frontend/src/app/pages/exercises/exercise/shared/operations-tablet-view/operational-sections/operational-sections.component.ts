import { Component } from '@angular/core';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import { selectOperationalSections } from '../../../../../../state/application/selectors/exercise.selectors';
import { map } from 'rxjs';
import { uuid } from 'digital-fuesim-manv-shared';

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
        console.log(uuid());
        try {
            this.exerciseService.proposeAction({
                type: '[OperationalSection] Add Operational Section',
                sectionId: uuid(),
                title: '???',
            });
        } catch (error) {
            console.error('Failed to add operational section:', error);
        }
    }
}
