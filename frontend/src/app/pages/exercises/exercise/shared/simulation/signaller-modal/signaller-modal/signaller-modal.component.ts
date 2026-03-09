import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    eocId,
    overviewId,
    SelectSignallerRegionService,
} from '../select-signaller-region.service';
import { HotkeysService } from '../../../../../../../shared/services/hotkeys.service';

@Component({
    selector: 'app-signaller-modal',
    templateUrl: './signaller-modal.component.html',
    styleUrls: ['./signaller-modal.component.scss'],
    standalone: false,
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
