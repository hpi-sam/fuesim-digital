import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { AppState } from '../../../../../../../state/app.state';
import { selectVehicles } from '../../../../../../../state/application/selectors/exercise.selectors';
import { type OperationalSection } from '../../../../../../../../../../shared/dist/models/operational-section';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ExerciseService } from '../../../../../../../core/exercise.service';

@Component({
    selector: 'app-operational-section-container',
    standalone: false,
    templateUrl: './operational-section-container.component.html',
    styleUrl: './operational-section-container.component.scss',
})
export class OperationalSectionContainerComponent {
    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    @Input()
    public operationalSection!: OperationalSection;

    public readonly vehiclesInThisOperationalSection$ = this.store.select(
        createSelector(selectVehicles, (vehicles) => {
            return Object.values(vehicles).filter(
                (vehicle) =>
                    vehicle.operationalSectionId === this.operationalSection.id
            );
        })
    );

    public onVehicleDropped(event: CdkDragDrop<string[]>) {
        console.log(event);
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Move Vehicle To Operational Section',
                sectionId: this.operationalSection.id,
                vehicleId: event.item.data,
            },
            true
        );
    }
}
