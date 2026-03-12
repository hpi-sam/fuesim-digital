import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID, SimulatedRegion } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { openSimulationTrainerModal } from '../../../simulation/trainer-modal/open-simulation-trainer-modal';
import { openPreviewModal } from '../../../simulation/trainer-modal/open-preview-modal';
import { PopupService } from '../../utility/popup.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectSimulatedRegion } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';
import { SimulatedRegionOverviewGeneralComponent } from '../../../simulation/trainer-modal/overview/simulated-region-overview.component';

@Component({
    selector: 'app-simulated-region-popup',
    templateUrl: './simulated-region-popup.component.html',
    styleUrls: ['./simulated-region-popup.component.scss'],
    imports: [NgbTooltip, SimulatedRegionOverviewGeneralComponent, AsyncPipe],
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

    openPreviewModal() {
        openPreviewModal(this.modalService, this.simulatedRegionId);
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}
