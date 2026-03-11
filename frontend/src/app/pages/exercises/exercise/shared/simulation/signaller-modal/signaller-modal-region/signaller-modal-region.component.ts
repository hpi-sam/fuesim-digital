import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { SimulatedRegion, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectSimulatedRegion } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-region',
    templateUrl: './signaller-modal-region.component.html',
    styleUrls: ['./signaller-modal-region.component.scss'],
    standalone: false,
})
export class SignallerModalRegionOverviewComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegionId = input.required<UUID>();

    simulatedRegion$!: Observable<SimulatedRegion>;
    noLeaderOverlayVisible = false;

    ngOnChanges() {
        this.simulatedRegion$ = this.store.select(
            createSelectSimulatedRegion(this.simulatedRegionId())
        );
    }

    public setNoLeaderOverlayState(newState: boolean) {
        this.noLeaderOverlayVisible = newState;
    }
}
