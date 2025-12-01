import type { ApplicationState } from './application/application.state';

export interface AppState {
    readonly application: ApplicationState;
}
