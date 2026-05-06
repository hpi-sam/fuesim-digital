import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { VehicleTemplate, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../state/app.state';
import { createSelectVehicleTemplate } from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-template-display',
    templateUrl: './vehicle-template-display.component.html',
    styleUrls: ['./vehicle-template-display.component.scss'],
    imports: [AsyncPipe],
})
export class VehicleTemplateDisplayComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly vehicleTemplateId = input.required<UUID>();

    public vehicleTemplate$?: Observable<VehicleTemplate>;

    ngOnChanges() {
        this.vehicleTemplate$ = this.store.select(
            createSelectVehicleTemplate(this.vehicleTemplateId())
        );
    }
}
