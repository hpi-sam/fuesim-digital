import type { Store } from '@ngrx/store';
import { defaults } from 'lodash-es';
import { environment } from '../../../environments/environment';

export interface CypressTestingValues {
    store: Store;
    backendBaseUrl: string;
    websocketBaseUrl: string;
}

export function isBeingTestedByCypress() {
    return 'Cypress' in window && !environment.production;
}

export function setupCypressTestingValues(
    values: Partial<CypressTestingValues>
) {
    const anyWindow = window as any;
    if (isBeingTestedByCypress()) {
        anyWindow.cypressTestingValues ??= {};
        defaults(anyWindow.cypressTestingValues, values);
    }
}
