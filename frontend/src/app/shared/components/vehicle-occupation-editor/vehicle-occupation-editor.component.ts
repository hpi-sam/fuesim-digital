import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import {
    type UUID,
    type ExerciseOccupation,
    newNoOccupation,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import { createSelectVehicle } from '../../../state/application/selectors/exercise.selectors';
import { OccupationNamePipe } from '../../pipes/occupation-name.pipe';

@Component({
    selector: 'app-vehicle-occupation-editor',
    templateUrl: './vehicle-occupation-editor.component.html',
    styleUrls: ['./vehicle-occupation-editor.component.scss'],
    imports: [AsyncPipe, OccupationNamePipe],
})
export class VehicleOccupationEditorComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly vehicleId = input.required<UUID>();
    occupation$!: Observable<ExerciseOccupation>;

    ngOnChanges() {
        this.occupation$ = this.store
            .select(createSelectVehicle(this.vehicleId()))
            .pipe(map((vehicle) => vehicle.occupation));
    }

    cancelOccupation() {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Set occupation',
            vehicleId: this.vehicleId(),
            occupation: newNoOccupation(),
        });
    }
}
