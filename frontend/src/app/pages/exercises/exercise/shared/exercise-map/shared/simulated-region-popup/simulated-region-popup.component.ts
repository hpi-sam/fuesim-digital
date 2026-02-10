import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID, SimulatedRegion } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectSimulatedRegion } from 'src/app/state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from 'src/app/state/application/selectors/shared.selectors';
import { openSimulationTrainerModal } from '../../../simulation/trainer-modal/open-simulation-trainer-modal';
import { PopupService } from '../../utility/popup.service';

@Component({
    selector: 'app-simulated-region-popup',
    templateUrl: './simulated-region-popup.component.html',
    styleUrls: ['./simulated-region-popup.component.scss'],
    standalone: false,
})
export class SimulatedRegionPopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly modalService = inject(NgbModal);
    private readonly popupService = inject(PopupService);

    // These properties are only set after OnInit
    public simulatedRegionId!: UUID;

    public simulatedRegion$?: Observable<SimulatedRegion>;
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    ngOnInit() {
        this.simulatedRegion$ = this.store.select(
            createSelectSimulatedRegion(this.simulatedRegionId)
        );
    }

    openInModal() {
        this.popupService.closePopup();
        openSimulationTrainerModal(this.modalService, this.simulatedRegionId);
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}
