import { Injectable, inject } from '@angular/core';
import type { UUID } from 'fuesim-digital-shared';
import { uuid } from 'fuesim-digital-shared';
import {
    BehaviorSubject,
    combineLatest,
    map,
    Observable,
    of,
    Subject,
    takeUntil,
} from 'rxjs';
// eslint-disable-next-line no-restricted-imports
import { HotkeysService as NgNeatHotkeysService } from '@ngneat/hotkeys';

const hotkeyReplacements = {
    ' ': '',
    '⇧': 'shift',
    '+': '.',
};

export type HotkeyState = 'disabled' | 'enabled' | 'overridden';

export class Hotkey {
    /**
     * Whether the layer of this hotkey is currently enabled.
     * Has to be set by the layer via {@link onLayerEnabled} and {@link onLayerDisabled}
     */
    private readonly layerEnabled$ = new Subject<boolean>();

    /**
     * Whether the hotkey is currently active.
     * Derived from the hotkey's and its layer's enabled state
     */
    public readonly state$ = new BehaviorSubject<HotkeyState>('overridden');

    private readonly destroy$ = new Subject<void>();

    constructor(
        public readonly keys: string,
        public readonly isCombo: boolean,
        private readonly callback: (keyboardEvent: KeyboardEvent) => void,
        private readonly enabled$: Observable<boolean> = of(true)
    ) {
        combineLatest([this.layerEnabled$, this.enabled$])
            .pipe(
                map(([layerEnabled, enabled]) =>
                    layerEnabled
                        ? enabled
                            ? 'enabled'
                            : 'disabled'
                        : 'overridden'
                ),
                takeUntil(this.destroy$)
            )
            .subscribe(this.state$);
    }

    /**
     * To be called by the {@link HotkeyLayer} when it gets disabled.
     */
    public onLayerEnabled() {
        this.layerEnabled$.next(true);
    }

    /**
     * To be called by the {@link HotkeyLayer} when it gets enabled.
     */
    public onLayerDisabled() {
        this.layerEnabled$.next(false);
    }

    /**
     * To be called by the {@link HotkeysService} if the keys of this hot key got pressed.
     *
     * The hotkey will only call its callback if it is currently enabled.
     * @param keyboardEvent The {@link KeyboardEvent} of the keyDown that triggered this hotkey
     */
    public onHotkey(keyboardEvent: KeyboardEvent) {
        if (this.state$.value === 'enabled') this.callback(keyboardEvent);
    }

    /**
     * Cancels all subscriptions to observables registered by this hotkey.
     *
     * To be called by the {@link HotkeyLayer} when the it gets destroyed.
     */
    public destroy() {
        this.destroy$.next();
    }

    /**
     * Returns a string that can be passed as hotkey definition to the underlying hotkey library.
     * This allows changing the library without updating all hotkey definitions in the code.
     *
     * Additionally, the string is normalized (lowercase, whitespace) to be able to detect hotkey collisions.
     * @returns A string that correctly defines the hotkey for the currently used library
     */
    public getKeysToRegister() {
        if (this.keys === '+') return this.keys;

        let keys = this.keys.toLowerCase();
        Object.entries(hotkeyReplacements).forEach(([from, to]) => {
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
        public readonly disableAllLower: boolean,
        private _enabled = true
    ) {}

    public get enabled() {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        if (value !== this._enabled) {
            this._enabled = value;
            this.service.recomputeHandlers();
        }
    }

    public addHotkey(hotkey: Hotkey) {
        this.hotkeys.push(hotkey);

        this.service.recomputeHandlers();
    }

    public removeAllHotkeys() {
        this.hotkeys.forEach((hotkey) => {
            hotkey.destroy();
        });
        this.hotkeys.splice(0);

        this.service.recomputeHandlers();
    }

    /**
     * Destroys all hotkeys in this layer
     */
    public destroy() {
        this.hotkeys.forEach((hotkey) => hotkey.destroy());
    }
}

@Injectable({
    providedIn: 'root',
})
export class HotkeysService {
    private readonly ngNeatHotkeysService = inject(NgNeatHotkeysService);

    private readonly layers: HotkeyLayer[] = [];
    private registeredHotkeys: { [key: string]: boolean } = {};

    /**
     * Creates a new layer and registers it at this service.
     * @param disableAllLower Whether all lower layers should be completely disabled. Defaults to `false`.
     * @param enabled Whether all hotkeys in this service should be enabled by default. Defaults to `true`.
     * @returns The new layer
     */
    public createLayer(
        disableAllLower: boolean = false,
        enabled: boolean = true
    ) {
        const layer = new HotkeyLayer(this, disableAllLower, enabled);
        this.layers.push(layer);

        return layer;
    }

    /**
     * Moves a layer to the top of the layer stack to ensure that its hotkeys have the highest priority
     * @param layer The layer to elevate
     */
    public elevateLayer(layer: HotkeyLayer) {
        const index = this.layers.findIndex((l) => l.id === layer.id);

        if (index !== -1) {
            this.layers.splice(index, 1);
            this.layers.push(layer);
            this.recomputeHandlers();
        }
    }

    /**
     * Removes a layer from the hotkey system, which disables and destroys all hotkeys that are part of this layer.
     * @param layer The layer to remove
     */
    public removeLayer(layer: HotkeyLayer) {
        const index = this.layers.findIndex((l) => l.id === layer.id);

        if (index !== -1) {
            this.layers.splice(index, 1);
            this.recomputeHandlers();
            layer.destroy();
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
                    layer.enabled &&
                    !disableAll
                ) {
                    this.ngNeatHotkeysService
                        .addShortcut({
                            keys: keysToRegister,
                            allowIn: ['INPUT', 'TEXTAREA', 'SELECT'],
                        })
                        .subscribe((event) => hotkey.onHotkey(event));

                    this.registeredHotkeys[keysToRegister] = hotkey.isCombo;
                    hotkey.onLayerEnabled();
                } else {
                    hotkey.onLayerDisabled();
                }
            });

            if (layer.enabled && layer.disableAllLower) {
                disableAll = true;
            }
        });
    }
}
