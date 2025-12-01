import type { Store } from '@ngrx/store';
import { first } from 'rxjs';
import type { AppState } from './app.state';

/**
 * A helper function to get the current immutable state synchronously.
 *
 * Warning: this is most of the time an anti-pattern for our ngrx-store.
 * If you want to observe the state and get notified of changes, you should use the selectors on the store.
 */
function getStateSnapshot(store: Store<AppState>): AppState {
    // There is sadly currently no other way to get the state synchronously...
    let currentState: AppState;
    // "Subscribing to Store will always be guaranteed to be synchronous" - https://github.com/ngrx/platform/issues/227#issuecomment-431682349
    store
        .select((state) => state)
        .pipe(first())
        .subscribe((s) => (currentState = s));
    return currentState!;
}

export function selectStateSnapshot<SelectedValue>(
    selector: (state: AppState) => SelectedValue,
    store: Store<AppState>
): SelectedValue {
    return selector(getStateSnapshot(store));
}
