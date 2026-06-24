import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import type { ExerciseState } from '../../state.js';
import { type TaskType, taskTypeSchema } from '../task-type.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from '../utils/image-properties.js';
import {
    newUserGeneratedContent,
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../user-generated-content.js';
import { type Personnel, personnelSchema } from '../personnel.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import {
    logTechnicalChallengePersonnelUnassigned,
    logTechnicalChallengeStateTransition,
} from '../../store/action-reducers/utils/log.js';
import type { TechnicalChallenge } from './technical-challenge.js';

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
    name: z.string(),
    totalDuration: z.number().nonnegative(),
});
type Timer = z.infer<typeof timerSchema>;

const taskGuardSchema = z.object({
    type: z.literal('taskGuard'),
    /** Percentage of Task.totalDuration */
    minProgress: z.number().min(0).max(1),
    taskId: taskSchema.shape.taskTypeId,
});
export type TaskGuard = Immutable<z.infer<typeof taskGuardSchema>>;

const timerGuardSchema = z.object({
    type: z.literal('timerGuard'),
    /** Percentage of Timer.totalDuration past */
    minProgress: z.number().min(0).max(1),
    timerId: timerSchema.shape.id,
});
export type TimerGuard = Immutable<z.infer<typeof timerGuardSchema>>;

/* Because AndGuard's and NotGuard's are recursive types, their type is not
 * directly inferred from their schema.
 *
 * They also can not be defined using `Immutable<>`, presumably because they
 * there is some interaction with the recursive nature of it.
 *
 * The current workaround is to define them using interfaces.
 */

const andGuardSchema = z.object({
    type: z.literal('andGuard'),
    get guards() {
        return z.array(guardSchema);
    },
});
export interface AndGuard {
    type: 'andGuard';
    guards: Immutable<_Guard[]>;
}

const notGuardSchema = z.strictObject({
    type: z.literal('notGuard'),
    get guard() {
        return guardSchema;
    },
});
export interface NotGuard {
    type: 'notGuard';
    guard: Immutable<_Guard>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type _Guard = AndGuard | NotGuard | TaskGuard | TimerGuard;
export const guardSchema: z.ZodType<_Guard> = z.lazy(() =>
    z.discriminatedUnion('type', [
        taskGuardSchema,
        timerGuardSchema,
        andGuardSchema,
        notGuardSchema,
    ])
);
export type Guard = Immutable<z.infer<typeof guardSchema>>;

const stateMachineStateIdSchema = uuidSchema.brand<'StateMachineStateId'>();
export const transitionSchema = z.object({
    targetState: stateMachineStateIdSchema,
    guard: guardSchema,
});

export const stateMachineStateSchema = z.object({
    id: stateMachineStateIdSchema,
    title: z.string(),
    image: imagePropertiesSchema,
    userGeneratedContent: userGeneratedContentSchema,
    viewedByParticipants: z.boolean().optional(),
    /**
     * maps taskId to the task-specific progress multiplier (default 1)
     * */
    possibleTasks: z.record(taskTypeSchema.shape.id, z.number()),
    outgoingTransitions: z.array(transitionSchema),

    viewedByParticipant: z.boolean().optional().default(false),
});
export type StateMachineState = Immutable<
    z.infer<typeof stateMachineStateSchema>
>;

export function newTechnicalChallengeState(
    title: string,
    image: ImageProperties,
    outgoingTransitions: Transition[],
    possibleTasks: UUID[] | { [key: UUID]: number } = {},
    userGeneratedContent?: UserGeneratedContent
): StateMachineState {
    if (possibleTasks instanceof Array) {
        // eslint-disable-next-line no-param-reassign
        possibleTasks = Object.fromEntries(possibleTasks.map((id) => [id, 1]));
    }
    return {
        id: uuid() as StateMachineState['id'],
        title,
        image,
        userGeneratedContent: userGeneratedContent ?? newUserGeneratedContent(),
        possibleTasks,
        outgoingTransitions,
        viewedByParticipant: false,
    };
}

export function addTransitionTo(
    state: StateMachineState,
    newTransition: Transition,
    priority?: number
): StateMachineState {
    const newTransitions = [...state.outgoingTransitions];
    newTransitions.splice(
        priority ?? state.outgoingTransitions.length,
        0,
        newTransition
    );

    return {
        ...state,
        outgoingTransitions: newTransitions,
    };
}

export function getTaskProgress(
    taskId: TaskType['id'],
    stateMachine: StateMachine
): TaskProgress {
    console.assert(
        stateMachine.tasks[taskId],
        `Task ${taskId} does not exist on stateMachine.`,
        stateMachine
    );
    const timeSpent = stateMachine.taskTimeSpent[taskId] ?? 0;
    const totalTaskDuration = stateMachine.tasks[taskId]!.totalDuration;
    const progressPercentage = timeSpent / totalTaskDuration;
    return { timeSpent, progressPercentage };
}

export function getTimerProgress(
    timerId: Timer['id'],
    stateMachine: StateMachine,
    currentTime: ExerciseState['currentTime']
): TimerProgress {
    const relativeTime = currentTime - stateMachine.simulationStartTime;

    const timer = stateMachine.timers[timerId]!;

    const progressPercentage = relativeTime / timer.totalDuration;

    return { relativeTime, progressPercentage };
}

export function getGuardProgress(
    guard: Guard,
    stateMachine: StateMachine,
    currentTime: ExerciseState['currentTime']
): GuardProgress {
    switch (guard.type) {
        case 'taskGuard':
            return getTaskProgress(guard.taskId, stateMachine);
        case 'timerGuard':
            return getTimerProgress(guard.timerId, stateMachine, currentTime);
        case 'andGuard': {
            const res = guard.guards.reduce(
                (v, g) =>
                    v +
                    getGuardProgress(g, stateMachine, currentTime)
                        .progressPercentage,
                0
            );
            return { progressPercentage: res / guard.guards.length };
        }
        case 'notGuard':
            return {
                progressPercentage: isGuardFulfilled(
                    guard.guard,
                    stateMachine,
                    currentTime
                )
                    ? 0
                    : 1,
            };
    }
}

export interface GuardProgress {
    progressPercentage: number;
}

export interface TaskProgress extends GuardProgress {
    timeSpent: number;
}

export interface TimerProgress extends GuardProgress {
    relativeTime: number;
}

function isTaskGuardFulfilled(
    taskGuard: TaskGuard,
    stateMachine: StateMachine
): boolean {
    const { progressPercentage } = getTaskProgress(
        taskGuard.taskId,
        stateMachine
    );
    return progressPercentage >= taskGuard.minProgress;
}

function isTimerGuardFulfilled(
    timerGuard: TimerGuard,
    stateMachine: StateMachine,
    currentTime: number
): boolean {
    const { progressPercentage } = getTimerProgress(
        timerGuard.timerId,
        stateMachine,
        currentTime
    );

    return progressPercentage >= timerGuard.minProgress;
}

export type Transition = z.infer<typeof transitionSchema>;

export const stateMachineDefinitionSchema = z.strictObject({
    id: uuidSchema.brand<'StateMachineId'>(),
    name: z.string(),
    states: z.record(stateMachineStateSchema.shape.id, stateMachineStateSchema),
    initialStateId: stateMachineStateSchema.shape.id,
    tasks: z.record(taskTypeSchema.shape.id, taskSchema),
    timers: z.record(timerSchema.shape.id, timerSchema),
});

export const stateMachineSchema = z
    .strictObject({
        ...stateMachineDefinitionSchema.shape,
        // runtime values:
        simulationStartTime: z.number().default(0),
        currentStateId: stateMachineStateSchema.shape.id,
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
export type StateMachine = Immutable<z.infer<typeof stateMachineSchema>>;

export function currentStateOf(
    stateMachine: WritableDraft<StateMachine>
): WritableDraft<StateMachineState>;
export function currentStateOf(stateMachine: StateMachine): StateMachineState;
export function currentStateOf(
    stateMachine: StateMachine | WritableDraft<StateMachine>
): StateMachineState | WritableDraft<StateMachineState> {
    const state = stateMachine.states[stateMachine.currentStateId];
    console.assert(
        !!state,
        `Invalid current state: ${stateMachine.currentStateId} for challenge ${stateMachine.id}`
    );
    return state!;
}

function currentlyPossibleTaskIds(
    stateMachine: StateMachine
): TaskType['id'][] {
    const currentState = currentStateOf(stateMachine);

    return TypeAssertedObject.keys(currentState.possibleTasks);
}

function unassignFromNonexistentTasks(
    stateMachine: WritableDraft<StateMachine>
): { personnelId: Personnel['id']; taskTypeId: TaskType['id'] }[] {
    const unassignedPersonnel: {
        taskTypeId: TaskType['id'];
        personnelId: Personnel['id'];
    }[] = [];
    for (const [personnelId, taskTypeId] of Object.entries(
        stateMachine.assignedPersonnel
    )) {
        if (!currentlyPossibleTaskIds(stateMachine).includes(taskTypeId)) {
            delete stateMachine.assignedPersonnel[personnelId];
            unassignedPersonnel.push({ taskTypeId, personnelId });
        }
    }
    return unassignedPersonnel;
}

function isGuardFulfilled(
    guard: Guard,
    stateMachine: StateMachine,
    currentTime: number
): boolean {
    switch (guard.type) {
        case 'taskGuard':
            return isTaskGuardFulfilled(guard, stateMachine);
        case 'timerGuard':
            return isTimerGuardFulfilled(guard, stateMachine, currentTime);
        case 'andGuard':
            return guard.guards.every((g) =>
                isGuardFulfilled(g, stateMachine, currentTime)
            );
        case 'notGuard':
            return !isGuardFulfilled(guard.guard, stateMachine, currentTime);
    }
}

function simulateStateMachine(
    stateMachine: WritableDraft<StateMachine>,
    currentTime: number,
    tickInterval: number,
    logStateTransition?: (targetStateId: StateMachineState['id']) => void,
    logPersonnelUnassigned?: (
        personnelId: Personnel['id'],
        taskTypeId: TaskType['id']
    ) => void
): void {
    const state = currentStateOf(stateMachine);

    for (const taskId of Object.values(stateMachine.assignedPersonnel)) {
        if (state.possibleTasks[taskId]) {
            stateMachine.taskTimeSpent[taskId] ??= 0;
            stateMachine.taskTimeSpent[taskId] +=
                tickInterval * state.possibleTasks[taskId];
        }
    }

    const guardFulfilled = (t: Transition) =>
        isGuardFulfilled(t.guard, stateMachine, currentTime);

    // the next transition is not necessarily the first one to have its guard
    // fulfilled
    const nextTransition = state.outgoingTransitions.find(guardFulfilled);

    if (!nextTransition) return;

    logStateTransition?.(nextTransition.targetState);

    stateMachine.currentStateId = nextTransition.targetState;

    const unassignedPersonnel = unassignFromNonexistentTasks(stateMachine);

    if (unassignedPersonnel.length > 0 && logPersonnelUnassigned) {
        for (const { personnelId, taskTypeId } of unassignedPersonnel) {
            logPersonnelUnassigned(personnelId, taskTypeId);
        }
    }
}

export function simulateTechnicalChallenge(
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    exerciseState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    for (const stateMachine of Object.values(
        technicalChallenge.stateMachines
    )) {
        const currentStateId = stateMachine.currentStateId;
        simulateStateMachine(
            stateMachine,
            exerciseState.currentTime,
            tickInterval,
            (targetStateId) =>
                logTechnicalChallengeStateTransition(
                    exerciseState,
                    technicalChallenge.id,
                    currentStateId,
                    targetStateId
                ),
            (personnelId, taskTypeId) =>
                logTechnicalChallengePersonnelUnassigned(
                    exerciseState,
                    technicalChallenge.id,
                    personnelId,
                    taskTypeId
                )
        );
    }
}

export function simulateAllTechnicalChallenges(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    for (const challenge of Object.values(draftState.technicalChallenges)) {
        simulateTechnicalChallenge(challenge, draftState, tickInterval);
    }
}
