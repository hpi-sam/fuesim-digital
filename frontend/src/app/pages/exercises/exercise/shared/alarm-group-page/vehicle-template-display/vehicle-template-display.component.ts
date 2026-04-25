import { Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { AsyncPipe, JsonPipe } from '@angular/common';
import type { AppState } from '../../../../../../state/app.state';
import { createSelectVehicleTemplate } from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-template-display',
    templateUrl: './vehicle-template-display.component.html',
    styleUrls: ['./vehicle-template-display.component.scss'],
    imports: [AsyncPipe, JsonPipe],
})
export class VehicleTemplateDisplayComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly vehicleTemplateId = input.required<UUID>();

    readonly vehicleTemplate = computed(() =>
        this.store.selectSignal(
            createSelectVehicleTemplate(this.vehicleTemplateId())
        )
    );
}
