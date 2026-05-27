import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import type { ExerciseState } from '../../state.js';
import { type TaskType, taskTypeSchema } from '../task-type.js';
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
import { personnelSchema } from '../personnel.js';
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

const taskSchema = z.object({
    /**
     * As there are never more than a single task of a type per state machine,
     * `taskTypeId` is also the primary key for tasks.
     */
    taskTypeId: taskTypeSchema.shape.id,
    totalDuration: z.number().nonnegative(),
});

const timerSchema = z.object({
    id: uuidSchema.brand<'TimerId'>(),
    totalDuration: z.number().nonnegative(),
});

const taskGuardSchema = z.object({
    type: z.literal('taskGuard'),
    /** Percentage of Task.totalDuration */
    minProgress: z.number().min(0).max(1),
    taskId: taskSchema.shape.taskTypeId,
});
export type TaskGuard = z.infer<typeof taskGuardSchema>;

const timerGuardSchema = z.object({
    type: z.literal('timerGuard'),
    /** Percentage of Timer.totalDuration */
    minPassed: z.number().min(0).max(1),
    timerId: timerSchema.shape.id,
});
export type TimerGuard = z.infer<typeof timerGuardSchema>;

const andGuardSchema = z.object({
    type: z.literal('andGuard'),
    get guards() {
        return z.array(guardSchema);
    },
});
export interface AndGuard {
    type: 'andGuard';
    guards: Guard[];
}

export const guardSchema: z.ZodType<Guard> = z.lazy(() =>
    z.discriminatedUnion('type', [
        taskGuardSchema,
        timerGuardSchema,
        andGuardSchema,
    ])
);
export type Guard = Immutable<AndGuard | TaskGuard | TimerGuard>;

export const transitionSchema = z.object({
    targetState: technicalChallengeStateIdSchema,
    guard: guardSchema,
});

export const technicalChallengeStateSchema = z.object({
    id: technicalChallengeStateIdSchema,
    title: z.string(),
    image: imagePropertiesSchema,
    userGeneratedContent: userGeneratedContentSchema,
    viewedByParticipants: z.boolean().optional(),
    /**
     * maps taskId to the task-specific progress multiplier (default 1)
     * */
    possibleTasks: z.record(taskTypeSchema.shape.id, z.number()),
    outgoingTransitions: z.array(transitionSchema),
});
export type TechnicalChallengeState = Immutable<
    z.infer<typeof technicalChallengeStateSchema>
>;

export function newTechnicalChallengeState(
    title: string,
    image: ImageProperties,
    outgoingTransitions: Transition[],
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
        outgoingTransitions,
    };
}

export function addTransitionTo(
    state: TechnicalChallengeState,
    newTransition: Transition,
    priority?: number
): TechnicalChallengeState {
    const newTransitions = state.outgoingTransitions.toS;
    [...newTransitions];
}

export function getTaskProgress(
    taskId: TaskType['id'],
    stateMachine: StateMachine
) {
    console.assert(
        stateMachine.tasks[taskId],
        `Task ${taskId} does not exist on stateMachine.`,
        stateMachine
    );
    const timeSpent = stateMachine.taskTimeSpent[taskId] ?? 0;
    const totalTaskDuration = stateMachine.tasks[taskId]!.totalDuration;
    const progress = timeSpent / totalTaskDuration;
    return { timeSpent, progress };
}

function isTaskGuardFulfilled(
    taskGuard: TaskGuard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    const challenge = getElement(
        exerciseState,
        'technicalChallenge',
        technicalChallengeId
    );
    const progress = getTaskProgress(taskGuard.taskId, challenge).progress;
    return progress >= taskGuard.minProgress;
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
    return relativeTime >= timerGuard.minPassed;
}

export type Transition = z.infer<typeof transitionSchema>;

export function isGuardFulfilled(
    guard: Guard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    switch (guard.type) {
        case 'taskGuard':
            return isTaskGuardFulfilled(
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
        case 'andGuard':
            return guard.guards.every((g) =>
                isGuardFulfilled(g, technicalChallengeId, exerciseState)
            );
    }
}

export const stateMachineSchema = z
    .strictObject({
        states: z.record(
            technicalChallengeStateSchema.shape.id,
            technicalChallengeStateSchema
        ),
        initialStateId: technicalChallengeStateSchema.shape.id,
        tasks: z.record(taskTypeSchema.shape.id, taskSchema),
        timers: z.record(timerSchema.shape.id, timerSchema),

        // runtime values:
        simulationStartTime: z.number().default(0),
        currentStateId: technicalChallengeStateSchema.shape.id,
        taskTimeSpent: z.record(
            taskTypeSchema.shape.id,
            z.number().nonnegative()
        ),
        assignedPersonnel: z.record(
            personnelSchema.shape.id,
            taskTypeSchema.shape.id
        ),
    })
    .superRefine((val, ctx) => {
        if (!(val.initialStateId in val.states)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Kein gültiger Startzustand festgelegt.',
                input: val,
            });
        }
    });
type StateMachine = Immutable<z.infer<typeof stateMachineSchema>>;

export function currentStateOf(
    technicalChallenge: WritableDraft<TechnicalChallenge>
): WritableDraft<TechnicalChallengeState>;
export function currentStateOf(
    technicalChallenge: TechnicalChallenge
): TechnicalChallengeState;
export function currentStateOf(
    technicalChallenge: TechnicalChallenge | WritableDraft<TechnicalChallenge>
): TechnicalChallengeState | WritableDraft<TechnicalChallengeState> {
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
    exerciseState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    const state = currentStateOf(technicalChallenge);
    for (const taskId of Object.values(technicalChallenge.assignedPersonnel)) {
        if (state.possibleTasks[taskId]) {
            technicalChallenge.taskTimeSpent[taskId] ??= 0;
            technicalChallenge.taskTimeSpent[taskId] +=
                tickInterval * state.possibleTasks[taskId];
        }
    }

    const guardFulfilled = (t: Transition) =>
        isGuardFulfilled(t.guard, technicalChallenge.id, exerciseState);

    // the next transition is not necessarily the first one to have its guard
    // fulfilled
    const nextTransition = state.outgoingTransitions.find(guardFulfilled);

    if (!nextTransition) return;

    logTechnicalChallengeStateTransition(
        exerciseState,
        technicalChallenge.id,
        technicalChallenge.currentStateId,
        nextTransition.targetState
    );

    technicalChallenge.currentStateId = nextTransition.targetState;

    const unassignedPersonnel =
        unassignFromNonexistentTasks(technicalChallenge);
    if (unassignedPersonnel.length > 0) {
        for (const { personnelId, taskId } of unassignedPersonnel) {
            logTechnicalChallengePersonnelUnassigned(
                exerciseState,
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
