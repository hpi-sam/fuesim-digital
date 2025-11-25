import type { ActionReducerMap } from '@ngrx/store';
import type { AppState } from './app.state.js';
import { applicationReducer } from './application/application.reducer.js';

export const appReducers: ActionReducerMap<AppState> = {
    application: applicationReducer,
};
