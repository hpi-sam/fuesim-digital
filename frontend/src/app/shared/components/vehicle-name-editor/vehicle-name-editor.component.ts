import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service.js';
import type { AppState } from 'src/app/state/app.state.js';
import { createSelectVehicle } from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-vehicle-name-editor',
    templateUrl: './vehicle-name-editor.component.html',
    styleUrls: ['./vehicle-name-editor.component.scss'],
    standalone: false,
})
export class VehicleNameEditorComponent implements OnChanges {
    @Input()
    vehicleId!: UUID;

    vehicle$!: Observable<Vehicle>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    ngOnChanges() {
        this.vehicle$ = this.store.select(createSelectVehicle(this.vehicleId));
    }

    public renameVehicle(name: string) {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Rename vehicle',
            vehicleId: this.vehicleId,
            name,
        });
    }
}
