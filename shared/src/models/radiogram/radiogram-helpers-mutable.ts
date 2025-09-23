import type { ExerciseState } from '../../state.js';
import { getExerciseRadiogramById } from '../../store/action-reducers/utils/get-element.js';
import { logRadiogram } from '../../store/action-reducers/utils/log.js';
import type { Mutable, UUID } from '../../utils/index.js';
import { createRadiogramActionTag } from '../utils/tag-helpers.js';
import type { ExerciseRadiogram } from './exercise-radiogram.js';
import { publishTimeOf } from './radiogram-helpers.js';

export function publishRadiogram(
    draftState: Mutable<ExerciseState>,
    radiogram: Mutable<ExerciseRadiogram>
) {
    radiogram.status = {
        type: 'unreadRadiogramStatus',
        publishTime: draftState.currentTime,
    };
    draftState.radiograms[radiogram.id] = radiogram;
    logRadiogram(
        draftState,
        [createRadiogramActionTag(draftState, radiogram.status.type)],
        'Der Funkspruch wurde veröffentlicht.',
        radiogram.id
    );
}

export function acceptRadiogram(
    draftState: Mutable<ExerciseState>,
    radiogramId: UUID,
    clientId: UUID
) {
    const radiogram = getExerciseRadiogramById(draftState, radiogramId);
    radiogram.status = {
        type: 'acceptedRadiogramStatus',
        publishTime: publishTimeOf(radiogram),
        clientId,
    };
    logRadiogram(
        draftState,
        [createRadiogramActionTag(draftState, radiogram.status.type)],
        'Der Funkspruch wurde zur Durchsage angenommen.',
        radiogram.id
    );
}

export function returnRadiogram(
    draftState: Mutable<ExerciseState>,
    radiogramId: UUID
) {
    const radiogram = getExerciseRadiogramById(draftState, radiogramId);
    radiogram.status = {
        type: 'unreadRadiogramStatus',
        publishTime: publishTimeOf(radiogram),
    };
    radiogram.informationRequestKey = null;
    logRadiogram(
        draftState,
        [createRadiogramActionTag(draftState, radiogram.status.type)],
        'Der Funkspruch wurde zurückgelegt.',
        radiogram.id
    );
}

export function markRadiogramDone(
    draftState: Mutable<ExerciseState>,
    radiogramId: UUID
) {
    const radiogram = getExerciseRadiogramById(draftState, radiogramId);
    radiogram.status = {
        type: 'doneRadiogramStatus',
        publishTime: publishTimeOf(radiogram),
    };
    logRadiogram(
        draftState,
        [createRadiogramActionTag(draftState, radiogram.status.type)],
        'Der Funkspruch wurde durchgesagt.',
        radiogram.id
    );
}
