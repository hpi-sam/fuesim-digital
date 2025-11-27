import type { ActionReducerMap } from '@ngrx/store';
import type { AppState } from './app.state';
import { applicationReducer } from './application/application.reducer';

export const appReducers: ActionReducerMap<AppState> = {
    application: applicationReducer,
};
