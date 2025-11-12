import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Patient, SimulatedRegion } from 'digital-fuesim-manv-shared';
import { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import { AppState } from 'src/app/state/app.state';
import { PatientCategory } from '../tabs/general-tab/simulated-region-overview-general-tab.component';
@Component({
    selector: 'app-simulated-region-preview',
    templateUrl: './simulated-region-preview.component.html',
    styleUrls: ['./simulated-region-preview.component.scss'],
    standalone: false,
})
export class SimulatedRegionPreviewComponent implements OnInit {
    @Input() simulatedRegion!: SimulatedRegion;
    @Input() patients!: {
        [Key in `${PatientCategory | 'all'}$`]?: Observable<Patient[]>;
    };

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    ngOnInit(): void {}
}
