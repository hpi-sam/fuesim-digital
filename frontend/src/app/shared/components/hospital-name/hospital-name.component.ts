import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Hospital, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state.js';
import { createSelectHospital } from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-hospital-name',
    templateUrl: './hospital-name.component.html',
    styleUrls: ['./hospital-name.component.scss'],
    standalone: false,
})
export class HospitalNameComponent implements OnChanges {
    @Input() hospitalId!: UUID;

    public hospital$?: Observable<Hospital>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnChanges() {
        this.hospital$ = this.store.select(
            createSelectHospital(this.hospitalId)
        );
    }
}
