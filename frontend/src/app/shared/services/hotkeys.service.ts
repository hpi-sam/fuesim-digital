import { Injectable } from '@angular/core';
import type { UUID } from 'digital-fuesim-manv-shared';
import { StrictObject, uuid } from 'digital-fuesim-manv-shared';
import { ReplaySubject } from 'rxjs';
import { HotkeysService as NgNeatHotkeysService } from '@ngneat/hotkeys';

const hotkeyReplacements = {
    ' ': '',
    '⇧': 'shift',
    '+': '.',
};

export class Hotkey {
    public readonly enabled = new ReplaySubject<boolean>(1);

    constructor(
        public readonly keys: string,
        public readonly isCombo: boolean,
        public readonly callback: (keyboardEvent: KeyboardEvent) => void
    ) {}

    public enable() {
        this.enabled.next(true);
    }

    public disable() {
        this.enabled.next(false);
    }

    /**
     * Returns a string that can be passed as hotkey definition to the underlying hotkey library.
     * This allows changing the library without updating all hotkey definitions in the code.
     *
     * Additionally, the string is normalized (lowercase, whitespace) to be able to detect hotkey collisions.
     * @param hotkey The hotkey to determine the correct definition for
     * @returns A string that correctly defines the hotkey for the currently used library
     */
    public getKeysToRegister() {
        if (this.keys === '+') return this.keys;

        let keys = this.keys.toLowerCase();
        StrictObject.entries(hotkeyReplacements).forEach(([from, to]) => {
            keys = keys.replaceAll(from, to);
        });

        return keys;
    }
}

export class HotkeyLayer {
    public readonly id: UUID = uuid();
    public readonly hotkeys: Hotkey[] = [];

    constructor(
        private readonly service: HotkeysService,
        public readonly disableAll: boolean
    ) {}

    public addHotkey(hotkey: Hotkey) {
        this.hotkeys.push(hotkey);

        this.service.recomputeHandlers();
    }

    public removeHotkey(hotkey: Hotkey) {
        this.removeHotkeyByKeys(hotkey.keys);
    }

    public removeHotkeyByKeys(keys: string) {
        const index = this.hotkeys.findIndex((hotkey) => hotkey.keys === keys);

        if (index !== -1) {
            this.hotkeys.splice(index, 1);
        }

        this.service.recomputeHandlers();
    }
}

@Injectable({
    providedIn: 'root',
})
export class HotkeysService {
    private readonly layers: HotkeyLayer[] = [];
    private registeredHotkeys: { [key: string]: boolean } = {};

    constructor(private readonly ngNeatHotkeysService: NgNeatHotkeysService) {}

    public createLayer(disableAll: boolean = false) {
        const layer = new HotkeyLayer(this, disableAll);
        this.layers.push(layer);

        return layer;
    }

    public removeLayer(layer: HotkeyLayer) {
        const index = this.layers.findIndex((l) => l.id === layer.id);

        if (index !== -1) {
            this.layers.splice(index, 1);
            this.recomputeHandlers();
        }
    }

    public recomputeHandlers() {
        Object.entries(this.registeredHotkeys).forEach(([hotkey, isCombo]) => {
            this.ngNeatHotkeysService.removeShortcuts(hotkey);
        });
        this.registeredHotkeys = {};

        let disableAll = false;

        [...this.layers].reverse().forEach((layer) => {
            layer.hotkeys.forEach((hotkey) => {
                const keysToRegister = hotkey.getKeysToRegister();
                if (
                    !(keysToRegister in this.registeredHotkeys) &&
                    !disableAll
                ) {
                    this.ngNeatHotkeysService
                        .addShortcut({
                            keys: keysToRegister,
                            allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                        })
                        .subscribe((event) => hotkey.callback(event));

                    this.registeredHotkeys[keysToRegister] = hotkey.isCombo;
                    hotkey.enable();
                } else {
                    hotkey.disable();
                }
            });

            if (layer.disableAll) {
                disableAll = true;
            }
        });
    }
}
