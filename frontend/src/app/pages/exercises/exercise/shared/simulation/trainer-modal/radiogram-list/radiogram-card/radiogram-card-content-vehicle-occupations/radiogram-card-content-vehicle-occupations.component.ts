import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseOccupationType,
    VehicleOccupationsRadiogram,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe, KeyValuePipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { KeysPipe } from '../../../../../../../../../shared/pipes/keys.pipe';
import { OccupationShortNamePipe } from '../../../../../../../../../shared/pipes/occupation-short-name.pipe';

@Component({
    selector: 'app-radiogram-card-content-vehicle-occupations',
    templateUrl: './radiogram-card-content-vehicle-occupations.component.html',
    styleUrls: ['./radiogram-card-content-vehicle-occupations.component.scss'],
    imports: [KeysPipe, OccupationShortNamePipe, AsyncPipe, KeyValuePipe],
})
export class RadiogramCardContentVehicleOccupationsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();
    radiogram$!: Observable<VehicleOccupationsRadiogram>;

    public occupationShortNames: {
        [key in ExerciseOccupationType]: string;
    } = {
        noOccupation: 'Keine Aufgabe',
        intermediateOccupation: 'Übergabe für nächste Nutzung',
        unloadingOccupation: 'Aussteigen',
        loadOccupation: 'Einsteigen',
        waitForTransferOccupation: 'Wartet auf Ausfahrt',
        patientTransferOccupation: 'Reserviert für Patiententransport',
    };

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<VehicleOccupationsRadiogram>(
                this.radiogramId()
            )
        );
    }
}
