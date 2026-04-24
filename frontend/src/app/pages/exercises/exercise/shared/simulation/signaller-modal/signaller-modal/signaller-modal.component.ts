import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import {
    eocId,
    overviewId,
    SelectSignallerRegionService,
} from '../select-signaller-region.service';
import { HotkeysService } from '../../../../../../../shared/services/hotkeys.service';
import { RadiogramListComponent } from '../../trainer-modal/radiogram-list/radiogram-list.component';
import { SignallerModalRegionSelectorComponent } from '../signaller-modal-region-selector/signaller-modal-region-selector.component';
import { SignallerModalEocComponent } from '../signaller-modal-eoc/signaller-modal-eoc.component';
import { SignallerModalRegionsOverviewComponent } from '../signaller-modal-regions-overview/signaller-modal-regions-overview.component';
import { SignallerModalRegionOverviewComponent } from '../signaller-modal-region/signaller-modal-region.component';

@Component({
    selector: 'app-signaller-modal',
    templateUrl: './signaller-modal.component.html',
    styleUrls: ['./signaller-modal.component.scss'],
    imports: [
        RadiogramListComponent,
        SignallerModalRegionSelectorComponent,
        SignallerModalEocComponent,
        SignallerModalRegionsOverviewComponent,
        SignallerModalRegionOverviewComponent,
        AsyncPipe,
    ],
})
export class SignallerModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly hotkeys = inject(HotkeysService);
    readonly selectRegionService = inject(SelectSignallerRegionService);

    public get eocId() {
        return eocId;
    }
    public get overviewId() {
        return overviewId;
    }

    public close() {
        this.activeModal.close();
    }
}
