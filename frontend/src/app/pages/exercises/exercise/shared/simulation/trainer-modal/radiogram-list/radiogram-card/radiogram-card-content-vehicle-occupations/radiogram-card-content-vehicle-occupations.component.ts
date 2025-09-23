import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseOccupationType,
    VehicleOccupationsRadiogram,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectRadiogram } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-vehicle-occupations',
    templateUrl: './radiogram-card-content-vehicle-occupations.component.html',
    styleUrls: ['./radiogram-card-content-vehicle-occupations.component.scss'],
    standalone: false,
})
export class RadiogramCardContentVehicleOccupationsComponent implements OnInit {
    @Input() radiogramId!: UUID;
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

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<VehicleOccupationsRadiogram>(this.radiogramId)
        );
    }
}
