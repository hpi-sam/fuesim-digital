import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferCountsRadiogram } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectRadiogram } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-transfer-counts',
    templateUrl: './radiogram-card-content-transfer-counts.component.html',
    styleUrls: ['./radiogram-card-content-transfer-counts.component.scss'],
    standalone: false,
})
export class RadiogramCardContentTransferCountsComponent implements OnInit {
    /**
     * Categories that should always be listed in the table.
     */
    readonly alwaysShowCategories = ['red', 'yellow', 'green'] as const;

    /**
     * Categories that should be listed in the table if patients of these categories have been transferred and/or are remaining.
     */
    readonly showIfTransferredOrRemainingCategories = [
        'blue',
        'white',
    ] as const;

    /**
     * Categories that should only be listed in the table if patients of these categories have been transferred.
     * (Black patients should usually never be transferred, so its okay to not show their remaining number.)
     */
    readonly showIfTransferredCategories = ['black'] as const;

    @Input() radiogramId!: UUID;

    radiogram$!: Observable<TransferCountsRadiogram>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<TransferCountsRadiogram>(this.radiogramId)
        );
    }
}
