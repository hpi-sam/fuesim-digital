import { Component, Input, OnInit } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { AppState } from '../../../../../../../state/app.state';
import { createSelectVehiclesInOperationalSection, selectVehicles } from '../../../../../../../state/application/selectors/exercise.selectors';
import { type OperationalSection } from '../../../../../../../../../../shared/dist/models/operational-section';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { first, map, Observable } from 'rxjs';
import { Vehicle } from 'digital-fuesim-manv-shared';

@Component({
    selector: 'app-operational-section-container',
    standalone: false,
    templateUrl: './operational-section-container.component.html',
    styleUrl: './operational-section-container.component.scss',
})
export class OperationalSectionContainerComponent implements OnInit {
    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) { }

    @Input()
    public operationalSection!: OperationalSection;

    public operationalSectionMembers$?: Observable<Vehicle[]>;


    public operationalSectionLeader$?: Observable<Vehicle | undefined>;


    ngOnInit() {
        this.operationalSectionLeader$ = this.store.select(
            createSelector(createSelectVehiclesInOperationalSection(this.operationalSection.id), (vehicles) => {
                return Object.values(vehicles).filter(
                    (vehicle) =>
                        vehicle.operationalAssignment?.type === "operationalSection" &&
                        vehicle.operationalAssignment.role === "operationalSectionLeader"
                );
            })
        ).pipe(map(vehicles => vehicles[0]));

        this.operationalSectionMembers$ = this.store.select(
            createSelector(createSelectVehiclesInOperationalSection(this.operationalSection.id), (vehicles) => {
                return Object.values(vehicles).filter(
                    (vehicle) =>
                        vehicle.operationalAssignment?.type === "operationalSection" &&
                        vehicle.operationalAssignment.role === "operationalSectionMember"
                );
            })
        );
    }

    public onVehicleDropped(event: CdkDragDrop<string[]>) {
        console.log(event);
        this.assignVehicle(event.item.data, false);
    }

    public assignVehicle(vehicleId: string, asSectionLeader: boolean) {
        console.log(vehicleId);
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Move Vehicle To Operational Section',
                sectionId: this.operationalSection.id,
                vehicleId: vehicleId,
                assignAsSectionLeader: asSectionLeader,
            },
            true
        );
    }
}
