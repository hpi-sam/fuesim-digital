import type { OnDestroy } from '@angular/core';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import type { AppState } from 'src/app/state/app.state.js';
import { createSelectSimulatedRegion } from 'src/app/state/application/selectors/exercise.selectors.js';

export const eocId = 'emergencyOperationsCenter';
export const overviewId = 'overview';

export type SignallerRegionID = UUID | typeof eocId | typeof overviewId;

@Injectable()
export class SelectSignallerRegionService implements OnDestroy {
    public readonly selectedSimulatedRegion$ =
        new ReplaySubject<SignallerRegionID | null>(1);

    private readonly destroy$ = new Subject<void>();

    constructor(private readonly store: Store<AppState>) {}

    public selectSimulatedRegion(id: SignallerRegionID) {
        this.selectedSimulatedRegion$.next(id);

        if (id !== eocId && id !== overviewId) {
            this.store
                .select(createSelectSimulatedRegion(id))
                .pipe(takeUntil(this.destroy$))
                .subscribe((simulatedRegion) => {
                    // The simulatedRegion could be undefined if the ID is invalid (e.g., the region was deleted)
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (!simulatedRegion) {
                        this.selectedSimulatedRegion$.next(null);
                    }
                });
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
    }
}
