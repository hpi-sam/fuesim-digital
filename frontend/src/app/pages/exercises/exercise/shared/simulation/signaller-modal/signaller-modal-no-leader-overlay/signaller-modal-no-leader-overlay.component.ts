import type { OnDestroy, OnInit } from '@angular/core';
import { Component, EventEmitter, Output } from '@angular/core';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service';

@Component({
    selector: 'app-signaller-modal-no-leader-overlay',
    templateUrl: './signaller-modal-no-leader-overlay.component.html',
    styleUrls: ['./signaller-modal-no-leader-overlay.component.scss'],
    standalone: false,
})
export class SignallerModalNoLeaderOverlayComponent
    implements OnInit, OnDestroy
{
    @Output() readonly accept = new EventEmitter<void>();

    private hotkeyLayer!: HotkeyLayer;

    acceptHotkey = new Hotkey('Enter', false, () => {
        this.accept.emit();
    });

    constructor(private readonly hotkeysService: HotkeysService) {}

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();

        this.hotkeyLayer.addHotkey(this.acceptHotkey);
    }

    ngOnDestroy() {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
    }
}
