import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { SimulatedRegion } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectSimulatedRegion } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-region',
    templateUrl: './signaller-modal-region.component.html',
    styleUrls: ['./signaller-modal-region.component.scss'],
    standalone: false,
})
export class SignallerModalRegionOverviewComponent implements OnChanges {
    @Input() simulatedRegionId!: UUID;

    simulatedRegion$!: Observable<SimulatedRegion>;
    noLeaderOverlayVisible = false;

    constructor(private readonly store: Store<AppState>) {}

    ngOnChanges() {
        this.simulatedRegion$ = this.store.select(
            createSelectSimulatedRegion(this.simulatedRegionId)
        );
    }

    public setNoLeaderOverlayState(newState: boolean) {
        this.noLeaderOverlayVisible = newState;
    }
}
