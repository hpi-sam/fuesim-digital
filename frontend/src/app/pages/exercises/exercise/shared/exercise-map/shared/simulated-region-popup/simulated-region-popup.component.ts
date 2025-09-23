import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID, SimulatedRegion } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectSimulatedRegion } from 'src/app/state/application/selectors/exercise.selectors';
import { selectCurrentRole } from 'src/app/state/application/selectors/shared.selectors';
import { openSimulationTrainerModal } from '../../../simulation/trainer-modal/open-simulation-trainer-modal';
import { PopupService } from '../../utility/popup.service';

@Component({
    selector: 'app-simulated-region-popup',
    templateUrl: './simulated-region-popup.component.html',
    styleUrls: ['./simulated-region-popup.component.scss'],
    standalone: false,
})
export class SimulatedRegionPopupComponent implements OnInit {
    // These properties are only set after OnInit
    public simulatedRegionId!: UUID;

    public simulatedRegion$?: Observable<SimulatedRegion>;
    public readonly currentRole$ = this.store.select(selectCurrentRole);

    constructor(
        private readonly store: Store<AppState>,
        private readonly modalService: NgbModal,
        private readonly popupService: PopupService
    ) {}

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
