import { Component, Input, OnInit } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { Vehicle } from 'digital-fuesim-manv-shared';
import { AppState } from 'src/app/state/app.state';
import { createSelectVehiclesInOperationalSection } from 'src/app/state/application/selectors/exercise.selectors';
import { type OperationalSection } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';

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
    ) {}

    @Input()
    public operationalSection!: OperationalSection;

    public operationalSectionMembers$?: Observable<Vehicle[]>;

    public operationalSectionLeader$?: Observable<Vehicle | undefined>;

    ngOnInit() {
        this.operationalSectionLeader$ = this.store
            .select(
                createSelector(
                    createSelectVehiclesInOperationalSection(
                        this.operationalSection.id
                    ),
                    (vehicles) =>
                        Object.values(vehicles).filter(
                            (vehicle) =>
                                vehicle.operationalAssignment?.type ===
                                    'operationalSection' &&
                                vehicle.operationalAssignment.role ===
                                    'operationalSectionLeader'
                        )
                )
            )
            .pipe(map((vehicles) => vehicles[0]));

        this.operationalSectionMembers$ = this.store.select(
            createSelector(
                createSelectVehiclesInOperationalSection(
                    this.operationalSection.id
                ),
                (vehicles) =>
                    Object.values(vehicles).filter(
                        (vehicle) =>
                            vehicle.operationalAssignment?.type ===
                                'operationalSection' &&
                            vehicle.operationalAssignment.role ===
                                'operationalSectionMember'
                    )
            )
        );
    }

    public onVehicleDropped(vehicleId: string) {
        this.assignVehicle(vehicleId, false);
    }

    public assignVehicle(vehicleId: string, asSectionLeader: boolean) {
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Move Vehicle To Operational Section',
                sectionId: this.operationalSection.id,
                vehicleId,
                assignAsSectionLeader: asSectionLeader,
            },
            true
        );
    }

    public updateOperationalSectionTitle(newTitle: string) {
        this.exerciseService.proposeAction({
            type: '[OperationalSection] Rename Operational Section',
            sectionId: this.operationalSection.id,
            newTitle,
        });
    }

    public deleteOperationalSection() {
        this.exerciseService.proposeAction({
            type: '[OperationalSection] Remove Operational Section',
            sectionId: this.operationalSection.id,
        });
    }
}
