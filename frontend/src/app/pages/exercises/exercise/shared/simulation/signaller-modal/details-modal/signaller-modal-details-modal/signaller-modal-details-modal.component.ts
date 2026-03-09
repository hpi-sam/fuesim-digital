import type { OnDestroy, OnInit } from '@angular/core';
import { Component, Input, TemplateRef, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type { HotkeyLayer } from '../../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../../shared/services/hotkeys.service';

@Component({
    selector: 'app-signaller-modal-details-modal',
    templateUrl: './signaller-modal-details-modal.component.html',
    styleUrls: ['./signaller-modal-details-modal.component.scss'],
    standalone: false,
})
export class SignallerModalDetailsModalComponent implements OnInit, OnDestroy {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly hotkeysService = inject(HotkeysService);

    @Input() title = '';
    @Input() body!: TemplateRef<any>;
    @Input() hotkeysEnabled = true;

    private hotkeyLayer?: HotkeyLayer;
    private readonly closeHotkey = new Hotkey('Esc', false, () => this.close());

    ngOnInit() {
        if (this.hotkeysEnabled) {
            this.hotkeyLayer = this.hotkeysService.createLayer(true);
            this.hotkeyLayer.addHotkey(this.closeHotkey);
        }
    }

    ngOnDestroy() {
        if (this.hotkeyLayer) this.hotkeysService.removeLayer(this.hotkeyLayer);
    }

    public close() {
        this.activeModal.close();
    }
}
