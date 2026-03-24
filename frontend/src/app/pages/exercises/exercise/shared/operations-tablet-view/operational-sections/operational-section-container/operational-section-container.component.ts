import { Component, inject, input, OnInit } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { map, Observable } from 'rxjs';
import { type OperationalSection, Vehicle } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { VehiclesZoneComponent } from '../vehicles-zone/vehicles-zone.component';
import { SectionLeaderSlotComponent } from '../section-leader-slot/section-leader-slot.component';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { AppState } from '../../../../../../../state/app.state';
import { createSelectVehiclesInOperationalSection } from '../../../../../../../state/application/selectors/exercise.selectors';
import { DisplayValidationComponent } from '../../../../../../../shared/validation/display-validation/display-validation.component';

@Component({
    selector: 'app-operational-section-container',
    templateUrl: './operational-section-container.component.html',
    styleUrl: './operational-section-container.component.scss',
    imports: [
        AsyncPipe,
        DisplayValidationComponent,
        FormsModule,
        SectionLeaderSlotComponent,
        VehiclesZoneComponent,
    ],
})
export class OperationalSectionContainerComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject(Store<AppState>);

    public readonly operationalSection = input.required<OperationalSection>();

    public operationalSectionMembers$?: Observable<Vehicle[]>;

    public operationalSectionLeader$?: Observable<Vehicle | undefined>;

    ngOnInit() {
        this.operationalSectionLeader$ = this.store
            .select(
                createSelector(
                    createSelectVehiclesInOperationalSection(
                        this.operationalSection().id
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
                    this.operationalSection().id
                ),
                (vehicles) => {
                    const data = Object.values(vehicles).filter(
                        (vehicle) =>
                            vehicle.operationalAssignment?.type ===
                                'operationalSection' &&
                            vehicle.operationalAssignment.role ===
                                'operationalSectionMember'
                    );
                    data.sort((a, b) => {
                        const positionA =
                            a.operationalAssignment?.type ===
                                'operationalSection' &&
                            a.operationalAssignment.role ===
                                'operationalSectionMember'
                                ? a.operationalAssignment.position
                                : -1;
                        const positionB =
                            b.operationalAssignment?.type ===
                                'operationalSection' &&
                            b.operationalAssignment.role ===
                                'operationalSectionMember'
                                ? b.operationalAssignment.position
                                : -1;
                        return positionA - positionB;
                    });
                    return data;
                }
            )
        );
    }

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
