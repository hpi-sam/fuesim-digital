import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable, combineLatest } from 'rxjs';
import type {
    RestrictedZone,
    UUID,
    VehicleTemplate,
    Vehicle,
    VehicleRestrictionType,
} from 'digital-fuesim-manv-shared';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectRestrictedZone,
    selectVehicleTemplates,
    selectVehicles,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from 'src/app/state/application/selectors/shared.selectors';
import { ExerciseService } from 'src/app/core/exercise.service';
import { PopupService } from '../../utility/popup.service';

type NavIds = 'settings' | 'vehicleRestrictions';

/**
 * We want to remember the last selected nav item, so the user doesn't have to manually select it again.
 */
let activeNavId: NavIds = 'settings';

@Component({
    selector: 'app-restricted-zone-popup',
    templateUrl: './restricted-zone-popup.component.html',
    styleUrls: ['./restricted-zone-popup.component.scss'],
    standalone: false,
})
export class RestrictedZonePopupComponent implements OnInit {
    // These properties are only set after OnInit
    public restrictedZoneId!: UUID;

    public restrictedZone$?: Observable<RestrictedZone>;
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);
    public availableVehicleTypes$?: Observable<string[]>;

    public get activeNavId() {
        return activeNavId;
    }
    public set activeNavId(value: NavIds) {
        activeNavId = value;
    }

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        private readonly popupService: PopupService
    ) {}

    ngOnInit() {
        this.restrictedZone$ = this.store.select(
            createSelectRestrictedZone(this.restrictedZoneId)
        );

        // Alle verfügbaren Fahrzeugtypen sammeln
        this.availableVehicleTypes$ = combineLatest([
            this.store.select(selectVehicleTemplates),
            this.store.select(selectVehicles),
        ]).pipe(
            map(([vehicleTemplates, vehiclesObject]) => {
                const vehicleTypes = new Set<string>();

                // Fahrzeugtypen aus Templates hinzufügen
                Object.values(vehicleTemplates).forEach(
                    (template: VehicleTemplate) => {
                        vehicleTypes.add(template.vehicleType);
                    }
                );

                // Fahrzeugtypen aus aktiven Fahrzeugen hinzufügen
                Object.values(vehiclesObject).forEach((vehicle: Vehicle) => {
                    vehicleTypes.add(vehicle.vehicleType);
                });

                return [...vehicleTypes].sort();
            })
        );
    }

    public renameRestrictedZone(newName: string) {
        this.exerciseService.proposeAction({
            type: '[RestrictedZone] Rename restricted zone',
            restrictedZoneId: this.restrictedZoneId,
            newName,
        });
    }

    public setRestrictedZoneCapacity(newCapacity: number) {
        this.exerciseService.proposeAction({
            type: '[RestrictedZone] Set capacity',
            restrictedZoneId: this.restrictedZoneId,
            newCapacity,
        });
    }

    public setRestrictedZoneColor(newColor: string) {
        this.exerciseService.proposeAction({
            type: '[RestrictedZone] Set color',
            restrictedZoneId: this.restrictedZoneId,
            newColor,
        });
    }

    public setVehicleRestriction(vehicleType: string, restriction: string) {
        this.exerciseService.proposeAction({
            type: '[RestrictedZone] Set vehicle restriction',
            restrictedZoneId: this.restrictedZoneId,
            vehicleType,
            restriction: restriction as VehicleRestrictionType,
        });
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}
