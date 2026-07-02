import { z } from 'zod';
import type { Immutable } from 'immer';
import type { TaskType } from '../task-type.js';
import { taskTypeSchema } from '../task-type.js';
import { uuidSchema } from '../../utils/uuid.js';

export const taskSchema = z.object({
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

/* Because Guards are recursive types, their type is not
 * directly inferred from their schema.
 *
 * They also can not be defined using `Immutable<>`, presumably because
 * there is some interaction with the recursive nature of it.
 *
 * The current workaround is to define them using interfaces.
 *
 * Every guard node has a stable `id`, used to key the runtime-only
 * lookup/backreference structures built in `guard-index.ts` — it must be
 * unique per guard *instance* (i.e. per position in a transition's guard
 * tree). Do not reuse the same guard object/id across multiple transitions.
 */
const baseGuardSchema = z.strictObject({
    id: uuidSchema.brand<'GuardId'>(),
});
export type GuardId = z.infer<typeof baseGuardSchema>['id'];

export const taskGuardSchema = z.strictObject({
    ...baseGuardSchema.shape,
    type: z.literal('taskGuard'),
    /** Percentage of Task.totalDuration */
    minProgress: z.number().min(0).max(1),
    taskId: taskSchema.shape.taskTypeId,
});
export interface TaskGuard {
    id: GuardId;
    type: 'taskGuard';
    minProgress: number;
    taskId: TaskType['id'];
}

export const timerGuardSchema = z.strictObject({
    ...baseGuardSchema.shape,
    type: z.literal('timerGuard'),
    /** Percentage of Timer.totalDuration past */
    minProgress: z.number().min(0).max(1),
    timerId: timerSchema.shape.id,
});
export interface TimerGuard {
    id: GuardId;
    type: 'timerGuard';
    minProgress: number;
    timerId: Timer['id'];
}

export const andGuardSchema = z.strictObject({
    ...baseGuardSchema.shape,
    type: z.literal('andGuard'),
    guards: z.lazy(() => z.array(guardSchema)),
});
export interface AndGuard {
    id: GuardId;
    type: 'andGuard';
    guards: Guard[];
}

export const notGuardSchema = z.strictObject({
    ...baseGuardSchema.shape,
    type: z.literal('notGuard'),
    guard: z.lazy(() => guardSchema),
});
export interface NotGuard {
    id: GuardId;
    type: 'notGuard';
    guard: Guard;
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
