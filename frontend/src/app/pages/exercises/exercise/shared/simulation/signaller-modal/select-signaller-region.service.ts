import type { OnDestroy } from '@angular/core';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import type { AppState } from '../../../../../../state/app.state';
import { createSelectSimulatedRegion } from '../../../../../../state/application/selectors/exercise.selectors';

export const eocId = 'emergencyOperationsCenter';
export const overviewId = 'overview';

export type SignallerRegionID = UUID | typeof eocId | typeof overviewId;

@Injectable()
export class SelectSignallerRegionService implements OnDestroy {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly selectedSimulatedRegion$ =
        new ReplaySubject<SignallerRegionID | null>(1);

    private readonly destroy$ = new Subject<void>();

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
