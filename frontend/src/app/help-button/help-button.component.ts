import { Component, input, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { environment } from '../../environments/environment.js';
import { selectCurrentMainRole } from '../state/application/selectors/shared.selectors.js';
import type { AppState } from '../state/app.state.js';

@Component({
    selector: 'app-help-button',
    imports: [],
    templateUrl: './help-button.component.html',
    styleUrl: './help-button.component.scss',
})
export class HelpButtonComponent {
    readonly url = input.required<string>();
    readonly docsUrl = environment.docsUrl;
    readonly trainerOnly = input<boolean>(false);

    private readonly store = inject<Store<AppState>>(Store);
    private readonly currentRole = this.store.selectSignal(
        selectCurrentMainRole
    );
    readonly displayComponent = computed(
        () => !this.trainerOnly() || this.currentRole() === 'trainer'
    );
}
