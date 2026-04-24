import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable, combineLatest } from 'rxjs';
import {
    type RestrictedZone,
    type UUID,
    type VehicleTemplate,
    type Vehicle,
    type VehicleRestriction,
    sortObject,
    stringCompare,
} from 'fuesim-digital-shared';
import {
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavContent,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { PopupService } from '../../utility/popup.service';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../state/app.state';
import {
    createSelectRestrictedZone,
    selectVehicleTemplates,
    selectVehicles,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';
import { AppSaveOnTypingDirective } from '../../../../../../../shared/directives/app-save-on-typing.directive';
import { DisplayValidationComponent } from '../../../../../../../shared/validation/display-validation/display-validation.component';

type NavIds = 'settings' | 'vehicleRestrictions';

/**
 * We want to remember the last selected nav item, so the user doesn't have to manually select it again.
 */
let activeNavId: NavIds = 'settings';

@Component({
    selector: 'app-restricted-zone-popup',
    templateUrl: './restricted-zone-popup.component.html',
    styleUrls: ['./restricted-zone-popup.component.scss'],
    imports: [
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkBase,
        NgbNavContent,
        FormsModule,
        AppSaveOnTypingDirective,
        DisplayValidationComponent,
        NgbNavOutlet,
        AsyncPipe,
        KeyValuePipe,
    ],
})
export class RestrictedZonePopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly popupService = inject(PopupService);

    // These properties are only set after OnInit
    public restrictedZoneId!: UUID;

    public restrictedZone$?: Observable<RestrictedZone>;
    public ignoredVehicleTypes$?: Observable<string[]>;
    public prohibitedVehicleTypes$?: Observable<string[]>;
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);
    public availableVehicleTemplates$?: Observable<{ [key: UUID]: string }>;

    public get activeNavId() {
        return activeNavId;
    }
    public set activeNavId(value: NavIds) {
        activeNavId = value;
    }

    ngOnInit() {
        this.restrictedZone$ = this.store.select(
            createSelectRestrictedZone(this.restrictedZoneId)
        );

        this.availableVehicleTemplates$ = combineLatest([
            this.store.select(selectVehicleTemplates),
            this.store.select(selectVehicles),
        ]).pipe(
            map(([vehicleTemplates, vehiclesObject]) => {
                const availableTemplates: { [key: UUID]: string } = {};

                Object.values(vehicleTemplates).forEach(
                    (template: VehicleTemplate) => {
                        availableTemplates[template.id] = template.vehicleType;
                    }
                );

                Object.values(vehiclesObject).forEach((vehicle: Vehicle) => {
                    if (!(vehicle.templateId in availableTemplates))
                        availableTemplates[vehicle.templateId] =
                            vehicle.vehicleType;
                });

                return sortObject(
                    availableTemplates,
                    ([keyA, valueA], [keyB, valueB]) =>
                        stringCompare(keyA as string, keyB as string)
                );
            })
        );

        this.ignoredVehicleTypes$ = combineLatest([
            this.restrictedZone$,
            this.availableVehicleTemplates$,
        ]).pipe(
            map(([restrictedZone, vehicleTemplates]) =>
                Object.entries(restrictedZone.vehicleRestrictions)
                    .filter(([_, restriction]) => restriction === 'ignore')
                    .map(
                        ([templateId, _]) =>
                            vehicleTemplates[templateId] ?? 'unbekannter Typ'
                    )
            )
        );

        this.prohibitedVehicleTypes$ = combineLatest([
            this.restrictedZone$,
            this.availableVehicleTemplates$,
        ]).pipe(
            map(([restrictedZone, vehicleTemplates]) =>
                Object.entries(restrictedZone.vehicleRestrictions)
                    .filter(([_, restriction]) => restriction === 'prohibit')
                    .map(
                        ([templateId, _]) =>
                            vehicleTemplates[templateId] ?? 'unbekannter Typ'
                    )
            )
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

    public setVehicleRestriction(
        vehicleTemplateId: string,
        restriction: string
    ) {
        this.exerciseService.proposeAction({
            type: '[RestrictedZone] Set vehicle restriction',
            restrictedZoneId: this.restrictedZoneId,
            vehicleTemplateId,
            restriction: restriction as VehicleRestriction,
        });
    }

    public setNameVisible(newNameVisible: boolean) {
        this.exerciseService.proposeAction({
            type: '[RestrictedZone] Set nameVisible',
            restrictedZoneId: this.restrictedZoneId,
            newNameVisible,
        });
    }

    public setCapacityVisible(newCapacityVisible: boolean) {
        this.exerciseService.proposeAction({
            type: '[RestrictedZone] Set capacityVisible',
            restrictedZoneId: this.restrictedZoneId,
            newCapacityVisible,
        });
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}
