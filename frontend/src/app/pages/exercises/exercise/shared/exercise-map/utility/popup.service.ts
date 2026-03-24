import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { OpenPopupOptions } from './popup-manager';

type PopupProposal =
    | {
          action: 'toggle';
          options: OpenPopupOptions;
      }
    | { action: 'dismiss' | 'submit'; options?: undefined };

/**
 * Allows for opening and closing popups using {@link togglePopup},
 * {@link submitPopup} and {@link dismissPopup}.
 *
 * Submitting a popup does not trigger it's {@link OpenPopupOptions.onDismissCallback}.
 */
@Injectable({
    providedIn: 'root',
})
export class PopupService {
    /**
     * New popup proposals are emitted via this subject.
     * @deprecated should only be subscribed by {@link PopupManager} and never
     *             emitted to.
     */
    public readonly nextProposal$ = new BehaviorSubject<PopupProposal>({
        action: 'dismiss',
    });

    /**
     * The {@link OpenPopupOptions} of the currently shown popup or `undefined`
     * if there is none.
     */
    get currentPopupOptions() {
        return this.nextProposal$.getValue().options;
    }

    /**
     * Closes the currently open popup without changes
     */
    public dismissPopup() {
        this.nextProposal$.next({ action: 'dismiss' });
    }

    /**
     * Closes the currently open popup after submitting new data
     */
    public submitPopup() {
        this.nextProposal$.next({ action: 'submit' });
    }

    /**
     * Opens a popup with the specified options.
     * If a popup with these exact options is already open,
     * it will be closed instead.
     */
    public togglePopup(options: OpenPopupOptions) {
        this.nextProposal$.next({ action: 'toggle', options });
    }
}
