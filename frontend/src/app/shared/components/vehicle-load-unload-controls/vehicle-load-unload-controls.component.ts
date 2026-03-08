import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Role, UUID } from 'fuesim-digital-shared';
import { isInSpecificVehicle } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map, startWith, switchMap } from 'rxjs';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import {
    createSelectVehicle,
    createSelectMaterial,
    createSelectPersonnel,
    createSelectPatient,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-vehicle-load-unload-controls',
    templateUrl: './vehicle-load-unload-controls.component.html',
    styleUrls: ['./vehicle-load-unload-controls.component.scss'],
    standalone: false,
})
export class VehicleLoadUnloadControlsComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    @Input()
    vehicleId!: UUID;

    vehicleLoadState$?: Observable<{ loadable: boolean; unloadable: boolean }>;
    currentRole$!: Observable<Role | undefined>;

    ngOnChanges(): void {
        const vehicle$ = this.store.select(createSelectVehicle(this.vehicleId));

        this.currentRole$ = this.store.select(selectCurrentMainRole);

        this.vehicleLoadState$ = vehicle$.pipe(
            switchMap((vehicle) => {
                const materialsAreInVehicle$ = Object.keys(
                    vehicle.materialIds
                ).map((materialId) =>
                    this.store
                        .select(createSelectMaterial(materialId))
                        .pipe(
                            map((material) =>
                                isInSpecificVehicle(material, vehicle.id)
                            )
                        )
                );
                const personnelAreInVehicle$ = Object.keys(
                    vehicle.personnelIds
                ).map((personnelId) =>
                    this.store
                        .select(createSelectPersonnel(personnelId))
                        .pipe(
                            map((personnel) =>
                                isInSpecificVehicle(personnel, vehicle.id)
                            )
                        )
                );
                const patientsAreInVehicle$ = Object.keys(
                    vehicle.patientIds
                ).map((patientId) =>
                    this.store
                        .select(createSelectPatient(patientId))
                        .pipe(
                            map((patient) =>
                                isInSpecificVehicle(patient, vehicle.id)
                            )
                        )
                );
                return combineLatest([
                    ...materialsAreInVehicle$,
                    ...personnelAreInVehicle$,
                    ...patientsAreInVehicle$,
                ]).pipe(startWith([]));
            }),
            map((areInVehicle) => ({
                loadable: areInVehicle.some((isInVehicle) => !isInVehicle),
                unloadable: areInVehicle.some((isInVehicle) => isInVehicle),
            }))
        );
    }

    public unloadVehicle() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Unload vehicle',
            vehicleId: this.vehicleId,
        });
    }

    public loadVehicle() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Completely load vehicle',
            vehicleId: this.vehicleId,
        });
    }
}
