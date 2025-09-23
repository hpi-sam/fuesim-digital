import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferCategoryCompletedRadiogram } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectRadiogram } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-transfer-category-completed',
    templateUrl:
        './radiogram-card-content-transfer-category-completed.component.html',
    styleUrls: [
        './radiogram-card-content-transfer-category-completed.component.scss',
    ],
    standalone: false,
})
export class RadiogramCardContentTransferCategoryCompletedComponent
    implements OnInit
{
    @Input() radiogramId!: UUID;

    radiogram$!: Observable<TransferCategoryCompletedRadiogram>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<TransferCategoryCompletedRadiogram>(
                this.radiogramId
            )
        );
    }
}
