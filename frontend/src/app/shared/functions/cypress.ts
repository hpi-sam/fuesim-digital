import type { Store } from '@ngrx/store';
import { environment } from 'src/environments/environment';
import { defaults } from 'lodash-es';

export interface CypressTestingValues {
    store: Store;
    backendBaseUrl: string;
    websocketBaseUrl: string;
}

export const isBeingTestedByCypress = () =>
    'Cypress' in window && !environment.production;

export const setupCypressTestingValues = (
    values: Partial<CypressTestingValues>
) => {
    const anyWindow = window as any;
    if (isBeingTestedByCypress()) {
        anyWindow.cypressTestingValues ??= {};
        defaults(anyWindow.cypressTestingValues, values);
    }
};
