import { Injectable } from '@angular/core';
import type { UUID } from 'digital-fuesim-manv-shared';
import { uuid } from 'digital-fuesim-manv-shared';
import { ReplaySubject } from 'rxjs';
import type { HotkeysEvent } from 'hotkeys-js';
import hotkeys from 'hotkeys-js';

export class Hotkey {
    public readonly enabled = new ReplaySubject<boolean>(1);

    constructor(
        public readonly keys: string,
        public readonly isCombo: boolean,
        public readonly callback: (
            keyboardEvent: KeyboardEvent,
            hotkeysEvent: HotkeysEvent
        ) => void
    ) {}

    public enable() {
        this.enabled.next(true);
    }

    public disable() {
        this.enabled.next(false);
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

    constructor() {
        hotkeys.filter = () => true;
    }

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
            if (hotkey === '+') {
                hotkeys.unbind('«');
            } else {
                hotkeys.unbind(hotkey);
            }
        });
        this.registeredHotkeys = {};

        let disableAll = false;

        [...this.layers].reverse().forEach((layer) => {
            layer.hotkeys.forEach((hotkey) => {
                const lowerCaseKeys = hotkey.keys.toLowerCase();
                if (!(lowerCaseKeys in this.registeredHotkeys) && !disableAll) {
                    let keysToRegister = hotkey.keys;
                    if (keysToRegister === '+') {
                        keysToRegister = '«';
                    }

                    hotkeys(keysToRegister, (keyboardEvent, hotkeysEvent) => {
                        keyboardEvent.preventDefault();
                        hotkey.callback(keyboardEvent, hotkeysEvent);
                    });

                    this.registeredHotkeys[lowerCaseKeys] = hotkey.isCombo;
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
