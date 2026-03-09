import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { PopupService } from '../../utility/popup.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectVehicle } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-vehicle-popup',
    templateUrl: './vehicle-popup.component.html',
    styleUrls: ['./vehicle-popup.component.scss'],
    standalone: false,
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
        this.popupService.closePopup();
    }
}
