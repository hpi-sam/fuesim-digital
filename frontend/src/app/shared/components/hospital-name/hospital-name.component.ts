import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Hospital, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import { createSelectHospital } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-hospital-name',
    templateUrl: './hospital-name.component.html',
    styleUrls: ['./hospital-name.component.scss'],
    imports: [AsyncPipe],
})
export class HospitalNameComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly hospitalId = input.required<UUID>();

    public hospital$?: Observable<Hospital>;

    ngOnChanges() {
        this.hospital$ = this.store.select(
            createSelectHospital(this.hospitalId())
        );
    }
}
