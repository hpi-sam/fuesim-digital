import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { httpOrigin, websocketOrigin } from './core/api-origins.js';
import { setupCypressTestingValues } from './shared/functions/cypress.js';
import type { AppState } from './state/app.state.js';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false,
})
export class AppComponent {
    constructor(private readonly store: Store<AppState>) {
        setupCypressTestingValues({
            store: this.store,
            backendBaseUrl: httpOrigin,
            websocketBaseUrl: websocketOrigin,
        });
    }
}
