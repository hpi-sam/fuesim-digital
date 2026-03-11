import type { OnDestroy, OnInit } from '@angular/core';
import { Component, output, inject } from '@angular/core';
import type { HotkeyLayer } from '../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../shared/services/hotkeys.service';

@Component({
    selector: 'app-signaller-modal-no-leader-overlay',
    templateUrl: './signaller-modal-no-leader-overlay.component.html',
    styleUrls: ['./signaller-modal-no-leader-overlay.component.scss'],
    standalone: false,
})
export class SignallerModalNoLeaderOverlayComponent
    implements OnInit, OnDestroy
{
    private readonly hotkeysService = inject(HotkeysService);

    readonly accept = output();

    private hotkeyLayer!: HotkeyLayer;

    acceptHotkey = new Hotkey('Enter', false, () => {
        this.accept.emit();
    });

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();

        this.hotkeyLayer.addHotkey(this.acceptHotkey);
    }

    ngOnDestroy() {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
    }
}
