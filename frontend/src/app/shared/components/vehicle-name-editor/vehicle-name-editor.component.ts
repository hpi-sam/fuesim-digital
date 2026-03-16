import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Vehicle, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import { createSelectVehicle } from '../../../state/application/selectors/exercise.selectors';
import { AppSaveOnTypingDirective } from '../../directives/app-save-on-typing.directive';
import { DisplayValidationComponent } from '../../validation/display-validation/display-validation.component';

@Component({
    selector: 'app-vehicle-name-editor',
    templateUrl: './vehicle-name-editor.component.html',
    styleUrls: ['./vehicle-name-editor.component.scss'],
    imports: [
        FormsModule,
        AppSaveOnTypingDirective,
        DisplayValidationComponent,
        AsyncPipe,
    ],
})
export class VehicleNameEditorComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly vehicleId = input.required<UUID>();

    vehicle$!: Observable<Vehicle>;

    ngOnChanges() {
        this.vehicle$ = this.store.select(
            createSelectVehicle(this.vehicleId())
        );
    }

    public renameVehicle(name: string) {
        this.exerciseService.proposeAction({
            type: '[Vehicle] Rename vehicle',
            vehicleId: this.vehicleId(),
            name,
        });
    }
}
