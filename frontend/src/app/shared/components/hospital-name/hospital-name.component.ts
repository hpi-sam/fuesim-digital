import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Hospital, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../state/app.state';
import { createSelectHospital } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-hospital-name',
    templateUrl: './hospital-name.component.html',
    styleUrls: ['./hospital-name.component.scss'],
    standalone: false,
})
export class HospitalNameComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    @Input() hospitalId!: UUID;

    public hospital$?: Observable<Hospital>;

    ngOnChanges() {
        this.hospital$ = this.store.select(
            createSelectHospital(this.hospitalId)
        );
    }
}
