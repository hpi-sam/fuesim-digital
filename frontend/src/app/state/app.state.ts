import type { ApplicationState } from './application/application.state.js';

export interface AppState {
    readonly application: ApplicationState;
}
