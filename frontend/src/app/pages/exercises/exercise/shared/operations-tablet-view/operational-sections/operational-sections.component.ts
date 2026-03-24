import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { uuid } from 'fuesim-digital-shared';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { AppState } from '../../../../../../state/app.state';
import { selectOperationalSections } from '../../../../../../state/application/selectors/exercise.selectors';
import { LocalOperationalLeaderComponent } from './local-operational-leader/local-operational-leader.component';
import { OperationalSectionContainerComponent } from './operational-section-container/operational-section-container.component';
import { VehiclesOnLocationComponent } from './vehicles-on-location/vehicles-on-location.component';

@Component({
    selector: 'app-operational-sections-tab',
    templateUrl: './operational-sections.component.html',
    styleUrl: './operational-sections.component.scss',
    imports: [
        LocalOperationalLeaderComponent,
        OperationalSectionContainerComponent,
        CdkDropListGroup,
        VehiclesOnLocationComponent,
    ],
})
export class OperationalSectionsTabComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject(Store<AppState>);

    private readonly operationalSectionsMap = this.store.selectSignal(
        selectOperationalSections
    );

    public readonly operationalSections = computed(() =>
        Object.values(this.operationalSectionsMap())
    );

    public addOperationalSection(): void {
        this.exerciseService.proposeAction({
            type: '[OperationalSection] Add Operational Section',
            sectionId: uuid(),
            title: 'Einsatzabschnitt ???',
        });
    }
}
