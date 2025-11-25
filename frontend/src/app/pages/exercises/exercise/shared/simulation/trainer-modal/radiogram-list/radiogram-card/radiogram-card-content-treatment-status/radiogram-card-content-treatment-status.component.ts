import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    TreatmentStatusRadiogram,
    UUID,
} from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state.js';
import { createSelectRadiogram } from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-radiogram-card-content-treatment-status',
    templateUrl: './radiogram-card-content-treatment-status.component.html',
    styleUrls: ['./radiogram-card-content-treatment-status.component.scss'],
    standalone: false,
})
export class RadiogramCardContentTreatmentStatusComponent implements OnInit {
    @Input() radiogramId!: UUID;

    radiogram$!: Observable<TreatmentStatusRadiogram>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<TreatmentStatusRadiogram>(this.radiogramId)
        );
    }
}
