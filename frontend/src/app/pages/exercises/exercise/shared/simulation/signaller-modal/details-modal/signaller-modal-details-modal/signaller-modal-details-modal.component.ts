import type { OnDestroy, OnInit } from '@angular/core';
import { Component, Input, TemplateRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service.js';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service.js';

@Component({
    selector: 'app-signaller-modal-details-modal',
    templateUrl: './signaller-modal-details-modal.component.html',
    styleUrls: ['./signaller-modal-details-modal.component.scss'],
    standalone: false,
})
export class SignallerModalDetailsModalComponent implements OnInit, OnDestroy {
    @Input() title = '';
    @Input() body!: TemplateRef<any>;
    @Input() hotkeysEnabled = true;

    private hotkeyLayer?: HotkeyLayer;
    private readonly closeHotkey = new Hotkey('Esc', false, () => this.close());

    constructor(
        private readonly activeModal: NgbActiveModal,
        private readonly hotkeysService: HotkeysService
    ) {}

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
