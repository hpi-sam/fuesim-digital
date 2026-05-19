import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PopupService } from '../../utility/popup.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectVehicle } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';
import { VehicleNameEditorComponent } from '../../../../../../../shared/components/vehicle-name-editor/vehicle-name-editor.component';
import { VehicleAvailableSlotsDisplayComponent } from '../../../../../../../shared/components/vehicle-available-slots-display/vehicle-available-slots-display.component';
import { VehicleLoadUnloadControlsComponent } from '../../../../../../../shared/components/vehicle-load-unload-controls/vehicle-load-unload-controls.component';

@Component({
    selector: 'app-vehicle-popup',
    templateUrl: './vehicle-popup.component.html',
    styleUrls: ['./vehicle-popup.component.scss'],
    imports: [
        VehicleNameEditorComponent,
        VehicleAvailableSlotsDisplayComponent,
        VehicleLoadUnloadControlsComponent,
        AsyncPipe,
    ],
})
export class VehiclePopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    // These properties are only set after OnInit
    public vehicleId!: UUID;

    public vehicle$?: Observable<Vehicle>;
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    ngOnInit() {
        this.vehicle$ = this.store.select(createSelectVehicle(this.vehicleId));
    }

    public closePopup() {
        this.popupService.dismissPopup();
    }
}
