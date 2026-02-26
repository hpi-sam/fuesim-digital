import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferCountsRadiogram, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-transfer-counts',
    templateUrl: './radiogram-card-content-transfer-counts.component.html',
    styleUrls: ['./radiogram-card-content-transfer-counts.component.scss'],
    standalone: false,
})
export class RadiogramCardContentTransferCountsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

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

    readonly radiogramId = input.required<UUID>();

    radiogram$!: Observable<TransferCountsRadiogram>;

    ngOnInit(): void {
        this.radiogram$ = this.store.select(
            createSelectRadiogram<TransferCountsRadiogram>(this.radiogramId())
        );
    }
}
