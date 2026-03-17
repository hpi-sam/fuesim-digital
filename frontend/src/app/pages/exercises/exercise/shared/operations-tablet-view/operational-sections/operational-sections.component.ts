import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { uuid } from 'fuesim-digital-shared';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { AppState } from '../../../../../../state/app.state';
import { selectOperationalSections } from '../../../../../../state/application/selectors/exercise.selectors';
import { LocalOperationalLeaderComponent } from './local-operational-leader/local-operational-leader.component';
import { OperationalSectionContainerComponent } from './operational-section-container/operational-section-container.component';

@Component({
    selector: 'app-operational-sections-tab',
    templateUrl: './operational-sections.component.html',
    styleUrl: './operational-sections.component.scss',
    imports: [
        LocalOperationalLeaderComponent,
        AsyncPipe,
        OperationalSectionContainerComponent,
        CdkDropListGroup,
    ],
})
export class OperationalSectionsTabComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject(Store<AppState>);

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
