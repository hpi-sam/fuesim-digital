import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { SimulatedRegion, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectSimulatedRegion } from '../../../../../../../state/application/selectors/exercise.selectors';
import { SignallerModalRegionLeaderComponent } from '../signaller-modal-region-leader/signaller-modal-region-leader.component';
import { SignallerModalRegionInformationComponent } from '../signaller-modal-region-information/signaller-modal-region-information.component';
import { SignallerModalRegionCommandsComponent } from '../signaller-modal-region-commands/signaller-modal-region-commands.component';
import { SignallerModalNoLeaderOverlayComponent } from '../signaller-modal-no-leader-overlay/signaller-modal-no-leader-overlay.component';

@Component({
    selector: 'app-signaller-modal-region',
    templateUrl: './signaller-modal-region.component.html',
    styleUrls: ['./signaller-modal-region.component.scss'],
    imports: [
        SignallerModalRegionLeaderComponent,
        SignallerModalRegionInformationComponent,
        SignallerModalRegionCommandsComponent,
        SignallerModalNoLeaderOverlayComponent,
        AsyncPipe,
    ],
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
