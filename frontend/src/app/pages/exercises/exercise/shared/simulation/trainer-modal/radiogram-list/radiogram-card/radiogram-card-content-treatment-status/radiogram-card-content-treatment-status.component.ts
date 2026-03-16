import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TreatmentStatusRadiogram, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { TreatmentStatusBadgeComponent } from '../../../treatment-status-badge/treatment-status-badge.component';

@Component({
    selector: 'app-radiogram-card-content-treatment-status',
    templateUrl: './radiogram-card-content-treatment-status.component.html',
    styleUrls: ['./radiogram-card-content-treatment-status.component.scss'],
    imports: [TreatmentStatusBadgeComponent, AsyncPipe],
})
export class RadiogramCardContentTreatmentStatusComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();

    radiogram$!: Observable<TreatmentStatusRadiogram>;

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<TreatmentStatusRadiogram>(this.radiogramId())
        );
    }
}
