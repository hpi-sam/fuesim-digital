import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import { createSelectVehicle } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-name-editor',
    templateUrl: './vehicle-name-editor.component.html',
    styleUrls: ['./vehicle-name-editor.component.scss'],
    standalone: false,
})
export class VehicleNameEditorComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    @Input()
    vehicleId!: UUID;

    vehicle$!: Observable<Vehicle>;

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
