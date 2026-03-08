import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { VehicleTemplate, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../../../../state/app.state';
import { createSelectVehicleTemplate } from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-template-display',
    templateUrl: './vehicle-template-display.component.html',
    styleUrls: ['./vehicle-template-display.component.scss'],
    standalone: false,
})
export class VehicleTemplateDisplayComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    @Input() vehicleTemplateId!: UUID;

    public vehicleTemplate$?: Observable<VehicleTemplate>;

    ngOnChanges() {
        this.vehicleTemplate$ = this.store.select(
            createSelectVehicleTemplate(this.vehicleTemplateId)
        );
    }
}
