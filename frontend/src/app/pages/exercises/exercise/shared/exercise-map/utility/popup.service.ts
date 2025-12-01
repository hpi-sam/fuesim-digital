import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type { OpenPopupOptions } from './popup-manager';

@Injectable({
    providedIn: 'root',
})
export class PopupService {
    /**
     * The currently open popup
     */
    public currentPopup: OpenPopupOptions | undefined;
    /**
     * This emits the current popup whenever it changes.
     */
    public readonly currentPopup$ = new Subject<{
        nextPopup: OpenPopupOptions | undefined;
        previousPopup: OpenPopupOptions | undefined;
    }>();
    /**
     * This should be notified, whenever the current popup should be changed
     */
    public readonly proposePopup$ = new Subject<OpenPopupOptions | undefined>();

    /**
     * Closes the currently open popup.
     */
    public closePopup() {
        this.proposePopup$.next(undefined);
    }

    /**
     * Opens a popup with the specified options.
     * If a popup with these exact options is already open,
     * it will be closed instead.
     * @param options The options for the popup
     */
    public openPopup(options: OpenPopupOptions) {
        this.proposePopup$.next(options);
    }

    /**
     *  Notifies all listeners, that a new popup was opened
     */
    public popupOpened(options: OpenPopupOptions | undefined) {
        const previousPopup = this.currentPopup;
        this.currentPopup = options;
        this.currentPopup$.next({
            nextPopup: options,
            previousPopup,
        });
    }
}
