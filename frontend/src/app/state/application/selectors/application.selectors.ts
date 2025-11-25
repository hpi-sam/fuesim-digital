import { createSelector } from '@ngrx/store';
import type { AppState } from '../../app.state.js';
import type { ApplicationState } from '../application.state.js';

const selectApplication = (state: AppState) => state.application;

function createSelectProperty<Key extends keyof ApplicationState>(key: Key) {
    return createSelector(selectApplication, (application) => application[key]);
}
export const selectExerciseId = createSelectProperty('exerciseId');
export const selectOwnClientId = createSelectProperty('ownClientId');
export const selectTimeConstraints = createSelectProperty('timeConstraints');
export const selectExerciseStateMode =
    createSelectProperty('exerciseStateMode');
export const selectLastClientName = createSelectProperty('lastClientName');
