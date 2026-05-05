import { z } from 'zod';
import type { WritableDraft } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import type { ExerciseState } from '../../state.js';
import { taskSchema } from '../task.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from '../utils/image-properties.js';
import { getElement } from '../../store/action-reducers/utils/get-element.js';
import {
    newUserGeneratedContent,
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../user-generated-content.js';
import {
    logTechnicalChallengePersonnelUnassigned,
    logTechnicalChallengeStateTransition,
} from '../../store/action-reducers/utils/log.js';
import { patientSchema } from '../patient.js';
import { newPatientFromTemplate } from '../patient-template.js';
import { newNoPosition } from '../utils/position/no-position.js';
import { defaultPatientCategories } from '../../data/default-state/patient-templates.js';
import { PatientActionReducers } from '../../store/action-reducers/patient.js';
import { ReducerError } from '../../store/reducer-error.js';
import {
    type MapPosition,
    newMapPositionAt,
} from '../utils/position/map-position.js';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';

export const technicalChallengeStateIdSchema = uuidSchema.brand(
    'TechnicalChallengeStateId'
);
export type TechnicalChallengeStateId = z.infer<
    typeof technicalChallengeStateIdSchema
>;

export const technicalChallengeStateSchema = z.object({
    id: technicalChallengeStateIdSchema,
    title: z.string(),
    image: imagePropertiesSchema,
    userGeneratedContent: userGeneratedContentSchema,
    /**
     * maps taskId to the task-specific progress multiplier (default 1)
     * */
    possibleTasks: z.record(taskSchema.shape.id, z.number()),
});
export type TechnicalChallengeState = z.infer<
    typeof technicalChallengeStateSchema
>;

export function newTechnicalChallengeState(
    title: string,
    image: ImageProperties,
    possibleTasks: UUID[] | { [key: UUID]: number } = {},
    userGeneratedContent?: UserGeneratedContent
): TechnicalChallengeState {
    if (possibleTasks instanceof Array) {
        // eslint-disable-next-line no-param-reassign
        possibleTasks = Object.fromEntries(possibleTasks.map((id) => [id, 1]));
    }
    return {
        id: uuid() as TechnicalChallengeStateId,
        title,
        image,
        userGeneratedContent: userGeneratedContent ?? newUserGeneratedContent(),
        possibleTasks,
    };
}

const progressGuardSchema = z.object({
    type: z.literal('progressGuard'),
    minProgress: z.number().optional(),
    maxProgress: z.number().optional(),
    taskId: uuidSchema,
    name: z.string().optional(),
});
export type ProgressGuard = z.infer<typeof progressGuardSchema>;

const timerGuardSchema = z.object({
    type: z.literal('timerGuard'),
    /** Time in exercise time */
    minTimePassed: z.number().nonnegative(),
    name: z.string().optional(),
});
export type TimerGuard = z.infer<typeof timerGuardSchema>;

function isProgressGuardFulfilled(
    progressGuard: ProgressGuard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    const challenge = getElement(
        exerciseState,
        'technicalChallenge',
        technicalChallengeId
    );
    const progress = challenge.taskProgress[progressGuard.taskId] ?? 0;
    return (
        progress < (progressGuard.maxProgress ?? Number.MAX_VALUE) &&
        progress >= (progressGuard.minProgress ?? 0)
    );
}

function isTimerGuardFulfilled(
    timerGuard: TimerGuard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    const challenge = getElement(
        exerciseState,
        'technicalChallenge',
        technicalChallengeId
    );
    const relativeTime =
        exerciseState.currentTime - challenge.simulationStartTime;
    return relativeTime >= timerGuard.minTimePassed;
}

export const guardSchema = z.union([progressGuardSchema, timerGuardSchema]);
export type Guard = ProgressGuard | TimerGuard;

const sideSchema = z.literal(['top', 'bottom', 'left', 'right']);
type Side = z.infer<typeof sideSchema>;

const patientOffset = 2;
function getPatientPosition(
    technicalChallenge: TechnicalChallenge,
    side: Side
): MapPosition {
    if (technicalChallenge.position.type !== 'coordinates')
        throw new ReducerError('');
    const coordinates = technicalChallenge.position.coordinates;
    const size = technicalChallenge.size;
    let x = 0;
    let y = 0;
    if (side === 'top' || side === 'bottom') {
        x = coordinates.x + size.width / 2;
    } else {
        y = coordinates.y - size.height / 2;
    }
    switch (side) {
        case 'top':
            y = coordinates.y - patientOffset;
            break;
        case 'bottom':
            y = coordinates.y + size.height + patientOffset;
            break;
        case 'left':
            x = coordinates.x - patientOffset;
            break;
        case 'right':
            x = coordinates.x + size.width + patientOffset;
            break;
    }
    return newMapPositionAt({ x, y });
}
export const createPatientTechnicalChallengeEventTemplateSchema =
    z.strictObject({
        type: z.literal('createPatientEvent'),
        id: uuidSchema,
        patientCategory: z.int().nonnegative(),
        side: sideSchema,
    });
export type CreatePatientTechnicalChallengeEventTemplate = z.infer<
    typeof createPatientTechnicalChallengeEventTemplateSchema
>;

export const createPatientTechnicalChallengeEventSchema = z.strictObject({
    type: z.literal('createPatientEvent'),
    id: uuidSchema,
    patient: patientSchema,
    side: sideSchema,
});
export type CreatePatientTechnicalChallengeEvent = z.infer<
    typeof createPatientTechnicalChallengeEventSchema
>;

export const technicalChallengeEventTemplateSchema = z.union([
    createPatientTechnicalChallengeEventTemplateSchema,
]);
export type TechnicalChallengeEventTemplate = z.infer<
    typeof technicalChallengeEventTemplateSchema
>;

export const technicalChallengeEventSchema = z.union([
    createPatientTechnicalChallengeEventSchema,
]);
export type TechnicalChallengeEvent = z.infer<
    typeof technicalChallengeEventSchema
>;

type TechnicalChallengeEventTemplateToEventFunction<Key> = (
    template: TechnicalChallengeEventTemplate & { type: Key }
) => (TechnicalChallengeEvent & { type: Key }) | null;
export const technicalChallengeEventTemplateToEventMap: {
    [Key in TechnicalChallengeEventTemplate['type']]: TechnicalChallengeEventTemplateToEventFunction<Key>;
} = {
    createPatientEvent: (template) => {
        const category = defaultPatientCategories[template.patientCategory];
        if (!category) return null;
        const patient = newPatientFromTemplate(
            category.patientTemplates[
                Math.floor(Math.random() * category.patientTemplates.length)
            ]!,
            category.name,
            newNoPosition()
        );
        return {
            type: 'createPatientEvent',
            id: template.id,
            side: template.side,
            patient,
        };
    },
};

type ApplyTechnicalChallengeEventFunction<Key> = (
    draftState: WritableDraft<ExerciseState>,
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    event: WritableDraft<TechnicalChallengeEvent & { type: Key }>
) => void;

export const applyTechnicalChallengeEventMap: {
    [Key in TechnicalChallengeEvent['type']]: ApplyTechnicalChallengeEventFunction<Key>;
} = {
    createPatientEvent: (draftState, technicalChallenge, event) => {
        PatientActionReducers.addPatient.reducer(draftState, {
            type: '[Patient] Add patient',
            patient: {
                ...event.patient,
                position: getPatientPosition(technicalChallenge, event.side),
            },
        });
    },
};

export function applyTechnicalChallengeEvent(
    draftState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    eventId: UUID
) {
    const technicalChallenge = getElement(
        draftState,
        'technicalChallenge',
        technicalChallengeId
    );
    const event = technicalChallenge.events[eventId];
    if (!event) return;
    applyTechnicalChallengeEventMap[event.type](
        draftState,
        technicalChallenge,
        event
    );
}

export const transitionSchema = z.object({
    to: technicalChallengeStateIdSchema,
    from: technicalChallengeStateIdSchema,
    guard: guardSchema,
    events: z.array(uuidSchema),
});

export type Transition = z.infer<typeof transitionSchema>;

export function isGuardFulfilled(
    guard: Guard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    switch (guard.type) {
        case 'progressGuard':
            return isProgressGuardFulfilled(
                guard,
                technicalChallengeId,
                exerciseState
            );
        case 'timerGuard':
            return isTimerGuardFulfilled(
                guard,
                technicalChallengeId,
                exerciseState
            );
    }
}

export const stateMachineSchema = z.strictObject({
    states: z.record(
        technicalChallengeStateSchema.shape.id,
        technicalChallengeStateSchema
    ),
    relevantTasks: z.record(taskSchema.shape.id, taskSchema),
    transitions: z.array(transitionSchema),
    simulationStartTime: z.number(),
});

export function currentStateOf(
    technicalChallenge: TechnicalChallenge
): TechnicalChallengeState {
    const state = technicalChallenge.states[technicalChallenge.currentStateId];
    console.assert(
        !!state,
        `Invalid current state: ${technicalChallenge.currentStateId} for challenge ${technicalChallenge.id}`
    );
    return state!;
}

export function currentlyPossibleTaskIds(
    technicalChallenge: TechnicalChallenge
): UUID[] {
    const currentState = currentStateOf(technicalChallenge);

    return Object.keys(currentState.possibleTasks);
}

function unassignFromNonexistentTasks(
    technicalChallenge: WritableDraft<TechnicalChallenge>
) {
    const unassignedPersonnel: { taskId: UUID; personnelId: UUID }[] = [];
    for (const [personnelId, taskId] of Object.entries(
        technicalChallenge.assignedPersonnel
    )) {
        if (!currentlyPossibleTaskIds(technicalChallenge).includes(taskId)) {
            delete technicalChallenge.assignedPersonnel[personnelId];
            unassignedPersonnel.push({ taskId, personnelId });
        }
    }
    return unassignedPersonnel;
}

export function simulateTechnicalChallenge(
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    const state = currentStateOf(technicalChallenge);
    for (const taskId of Object.values(technicalChallenge.assignedPersonnel)) {
        if (state.possibleTasks[taskId]) {
            technicalChallenge.taskProgress[taskId] ??= 0;
            technicalChallenge.taskProgress[taskId] +=
                tickInterval * state.possibleTasks[taskId];
        }
    }

    const fromCurrentState = (t: Transition) =>
        t.from === technicalChallenge.currentStateId;
    const guardFulfilled = (t: Transition) =>
        isGuardFulfilled(t.guard, technicalChallenge.id, draftState);

    // the next transition is not necessarily the first one to have its guard
    // fulfilled
    const nextTransition = technicalChallenge.transitions
        .filter(fromCurrentState)
        .find(guardFulfilled);

    if (!nextTransition) return;

    logTechnicalChallengeStateTransition(
        draftState,
        technicalChallenge.id,
        technicalChallenge.currentStateId,
        nextTransition.to
    );

    technicalChallenge.currentStateId = nextTransition.to;

    for (const eventId of nextTransition.events) {
        applyTechnicalChallengeEvent(
            draftState,
            technicalChallenge.id,
            eventId
        );
    }

    const unassignedPersonnel =
        unassignFromNonexistentTasks(technicalChallenge);
    if (unassignedPersonnel.length > 0) {
        for (const { personnelId, taskId } of unassignedPersonnel) {
            logTechnicalChallengePersonnelUnassigned(
                draftState,
                technicalChallenge.id,
                personnelId,
                taskId
            );
        }
    }
}

export function simulateAllTechnicalChallenges(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    Object.values(draftState.technicalChallenges).forEach((challenge) =>
        simulateTechnicalChallenge(challenge, draftState, tickInterval)
    );
}
