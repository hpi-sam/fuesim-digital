import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectVehicle } from 'src/app/state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from 'src/app/state/application/selectors/shared.selectors';
import { PopupService } from '../../utility/popup.service';

@Component({
    selector: 'app-vehicle-popup',
    templateUrl: './vehicle-popup.component.html',
    styleUrls: ['./vehicle-popup.component.scss'],
    standalone: false,
})
export class VehiclePopupComponent implements OnInit {
    // These properties are only set after OnInit
    public vehicleId!: UUID;

    public vehicle$?: Observable<Vehicle>;
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    constructor(
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {}

    ngOnInit() {
        this.vehicle$ = this.store.select(createSelectVehicle(this.vehicleId));
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}
