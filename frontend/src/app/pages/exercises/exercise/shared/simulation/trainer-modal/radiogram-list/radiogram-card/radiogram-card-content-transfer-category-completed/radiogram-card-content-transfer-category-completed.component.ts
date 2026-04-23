import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    TransferCategoryCompletedRadiogram,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { PatientStatusBadgeComponent } from '../../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';

@Component({
    selector: 'app-radiogram-card-content-transfer-category-completed',
    templateUrl:
        './radiogram-card-content-transfer-category-completed.component.html',
    styleUrls: [
        './radiogram-card-content-transfer-category-completed.component.scss',
    ],
    imports: [PatientStatusBadgeComponent, AsyncPipe],
})
export class RadiogramCardContentTransferCategoryCompletedComponent
    implements OnInit
{
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();

    radiogram$!: Observable<TransferCategoryCompletedRadiogram>;

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<TransferCategoryCompletedRadiogram>(
                this.radiogramId()
            )
        );
    }
}
