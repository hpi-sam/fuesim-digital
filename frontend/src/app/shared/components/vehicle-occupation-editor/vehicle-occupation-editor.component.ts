import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import type { UUID } from 'digital-fuesim-manv-shared';
import { NoOccupation } from 'digital-fuesim-manv-shared';
import type { ExerciseOccupation } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import type { AppState } from 'src/app/state/app.state';
import { ExerciseService } from 'src/app/core/exercise.service';
import { createSelectVehicle } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-occupation-editor',
    templateUrl: './vehicle-occupation-editor.component.html',
    styleUrls: ['./vehicle-occupation-editor.component.scss'],
    standalone: false,
})
export class VehicleOccupationEditorComponent implements OnChanges {
    @Input() vehicleId!: UUID;
    occupation$!: Observable<ExerciseOccupation>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    ngOnChanges() {
        this.occupation$ = this.store
            .select(createSelectVehicle(this.vehicleId))
            .pipe(map((vehicle) => vehicle.occupation));
    }

    cancelOccupation() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Set occupation',
            vehicleId: this.vehicleId,
            occupation: NoOccupation.create(),
        });
    }
}
