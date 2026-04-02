import { Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import { type OperationalSection } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { VehiclesZoneComponent } from '../vehicles-zone/vehicles-zone.component';
import { SectionLeaderSlotComponent } from '../section-leader-slot/section-leader-slot.component';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { AppState } from '../../../../../../../state/app.state';
import {
    createSelectOperationalSectionLeader,
    createSelectSortedOperationalSectionMembers,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { DisplayValidationComponent } from '../../../../../../../shared/validation/display-validation/display-validation.component';

@Component({
    selector: 'app-operational-section-container',
    templateUrl: './operational-section-container.component.html',
    styleUrl: './operational-section-container.component.scss',
    imports: [
        DisplayValidationComponent,
        FormsModule,
        SectionLeaderSlotComponent,
        VehiclesZoneComponent,
    ],
})
export class OperationalSectionContainerComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject(Store<AppState>);

    public readonly operationalSection = input.required<OperationalSection>();

    public readonly operationalSectionLeader = computed(() =>
        this.store.selectSignal(
            createSelectOperationalSectionLeader(this.operationalSection().id)
        )()
    );

    public readonly operationalSectionMembers = computed(() =>
        this.store.selectSignal(
            createSelectSortedOperationalSectionMembers(
                this.operationalSection().id
            )
        )()
    );

    public assignVehicle(
        vehicleId: string,
        asSectionLeader: boolean,
        position: number | undefined = undefined
    ) {
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Move Vehicle To Operational Section',
                sectionId: this.operationalSection().id,
                vehicleId,
                assignAsSectionLeader: asSectionLeader,
                position,
            },
            true
        );
    }

    public updateOperationalSectionTitle(newTitle: string) {
        this.exerciseService.proposeAction({
            type: '[OperationalSection] Rename Operational Section',
            sectionId: this.operationalSection().id,
            newTitle,
        });
    }

    public deleteOperationalSection() {
        this.exerciseService.proposeAction({
            type: '[OperationalSection] Remove Operational Section',
            sectionId: this.operationalSection().id,
        });
    }
}
