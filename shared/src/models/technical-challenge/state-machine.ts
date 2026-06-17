import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import { taskTimeSpentSchema, taskTypeSchema } from '../task-type.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from '../utils/image-properties.js';
import {
    newUserGeneratedContent,
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../user-generated-content.js';
import { personnelSchema } from '../personnel.js';
import type { GuardId } from './ids.js';
import {
    guardIdSchema,
    stateMachineIdSchema,
    transitionIdSchema,
} from './ids.js';

const taskSchema = z.object({
    /**
     * As there are never more than a single task of a type per state machine,
     * `taskTypeId` is also the primary key for tasks.
     */
    taskTypeId: taskTypeSchema.shape.id,
    totalDuration: z.number().nonnegative(),
});

export const timerSchema = z.object({
    id: uuidSchema.brand<'TimerId'>(),
    name: z.string(),
    totalDuration: z.number().nonnegative(),
});
export type Timer = z.infer<typeof timerSchema>;

const baseGuardSchema = z.strictObject({
    id: guardIdSchema,
});

export const taskGuardSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('taskGuard'),
    /** Percentage of Task.totalDuration */
    minProgress: z.number().min(0).max(1),
    taskId: taskSchema.shape.taskTypeId,
});
export type TaskGuard = Immutable<z.infer<typeof taskGuardSchema>>;

export const timerGuardSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('timerGuard'),
    /** Percentage of Timer.totalDuration past */
    minProgress: z.number().min(0).max(1),
    timerId: timerSchema.shape.id,
});
export type TimerGuard = Immutable<z.infer<typeof timerGuardSchema>>;

/* Because AndGuard's and NotGuard's are recursive types, their type is not
 * directly inferred from their schema.
 *
 * They also can not be defined using `Immutable<>`, presumably because
 * there is some interaction with the recursive nature of it.
 *
 * The current workaround is to define them using interfaces.
 */

export const andGuardSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('andGuard'),
    get guards() {
        return z.array(guardSchema);
    },
});
export interface AndGuard {
    id: GuardId;
    type: 'andGuard';
    guards: Immutable<_Guard[]>;
}

export const notGuardSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('notGuard'),
    get guard() {
        return guardSchema;
    },
});
export interface NotGuard {
    id: GuardId;
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

export const transitionSchema = z.strictObject({
    id: transitionIdSchema,
    targetState: stateMachineStateIdSchema,
    guard: guardSchema,
});
export type Transition = Immutable<z.infer<typeof transitionSchema>>;

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
    outgoingTransitions: z.record(transitionIdSchema, transitionSchema),

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
        outgoingTransitions: Object.fromEntries(
            outgoingTransitions.map((t) => [t.id, t])
        ),
        viewedByParticipant: false,
    };
}

/**
 * Not currently called anywhere. If this becomes used to edit a live
 * state machine's guard tree, the caller must also call
 * {@link invalidateGuardIndex} for that state machine's id, since this
 * changes the guard tree topology.
 */
export function addTransitionTo(
    state: StateMachineState,
    newTransition: Transition,
    priority?: number
): StateMachineState {
    const newTransitions = { ...state.outgoingTransitions };
    newTransitions[newTransition.id] = newTransition;

    return {
        ...state,
        outgoingTransitions: newTransitions,
    };
}

export interface GuardProgress {
    progressPercentage: number;
}

export interface TaskProgress extends GuardProgress {
    timeSpent: number;
    rate: number;
}

export interface TimerProgress extends GuardProgress {
    relativeTime: number;
}

export const stateMachineDefinitionSchema = z.strictObject({
    id: stateMachineIdSchema,
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
        taskTimeSpent: z.record(taskTypeSchema.shape.id, taskTimeSpentSchema),
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
