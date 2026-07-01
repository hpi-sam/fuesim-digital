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
 */
const baseGuardSchema = z.strictObject({
    nextChange: z.int().nonnegative().optional(),
});
const guardParentSchema = z.strictObject({
    parent: z.lazy(() => guardSchema.optional()),
});

export const taskGuardWireSchema = z.strictObject({
    ...baseGuardSchema.shape,
    type: z.literal('taskGuard'),
    /** Percentage of Task.totalDuration */
    minProgress: z.number().min(0).max(1),
    taskId: taskSchema.shape.taskTypeId,
});
export type TaskGuardWire = z.infer<typeof taskGuardWireSchema>;
export const taskGuardSchema = z.strictObject({
    ...taskGuardWireSchema.shape,
    ...guardParentSchema.shape,
});
export interface TaskGuard {
    type: 'taskGuard';
    minProgress: number;
    taskId: TaskType['id'];
    nextChange?: number;
    parent?: Guard;
}

export const timerGuardWireSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('timerGuard'),
    /** Percentage of Timer.totalDuration past */
    minProgress: z.number().min(0).max(1),
    timerId: timerSchema.shape.id,
});
export type TimerGuardWire = z.infer<typeof timerGuardWireSchema>;
export const timerGuardSchema = z.strictObject({
    ...timerGuardWireSchema.shape,
    ...guardParentSchema.shape,
});
export interface TimerGuard {
    type: 'timerGuard';
    minProgress: number;
    timerId: Timer['id'];
    nextChange?: number;
    parent?: Guard;
}

const andGuardWireSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('andGuard'),
    guards: z.lazy(() => z.array(guardWireSchema)),
});
export interface AndGuardWire {
    type: 'andGuard';
    guards: readonly _GuardWire[];
    nextChange?: number;
}
export const andGuardSchema = z.strictObject({
    ...andGuardWireSchema.shape,
    ...guardParentSchema.shape,
});
export interface AndGuard {
    type: 'andGuard';
    guards: Guard[];
    nextChange?: number;
    parent?: Guard;
}

const notGuardWireSchema = z.strictObject({
    ...baseGuardSchema.shape,
    type: z.literal('notGuard'),
    guard: z.lazy(() => guardWireSchema),
});
export interface NotGuardWire {
    type: 'notGuard';
    guard: _GuardWire;
    nextChange?: number;
}
export const notGuardSchema = z.strictObject({
    ...notGuardWireSchema.shape,
    ...guardParentSchema.shape,
});
export interface NotGuard {
    type: 'notGuard';
    guard: Guard;
    nextChange?: number;
    parent?: Guard;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type _GuardWire = AndGuardWire | NotGuardWire | TaskGuardWire | TimerGuardWire;
export const guardWireSchema: z.ZodType<_GuardWire> = z.lazy(() =>
    z.discriminatedUnion('type', [
        taskGuardWireSchema,
        timerGuardWireSchema,
        andGuardWireSchema,
        notGuardWireSchema,
    ])
);
export type GuardWire = Immutable<z.infer<typeof guardWireSchema>>;

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

export function decodeGuard(wire: GuardWire, parent: Guard | undefined): Guard {
    switch (wire.type) {
        case 'andGuard': {
            const node: AndGuard = {
                type: 'andGuard' as const,
                guards: [],
                parent,
            };
            node.guards = wire.guards.map((g) => decodeGuard(g, node));
            return node;
        }
        case 'notGuard': {
            const node: any = {
                type: 'notGuard' as const,
                guard: null,
                parent,
            };
            node.guard = decodeGuard(wire.guard, node);
            return node as NotGuard;
        }
        case 'taskGuard':
        case 'timerGuard':
            return { ...wire, parent };
    }
}

export function encodeGuard(g: Guard): GuardWire {
    switch (g.type) {
        case 'andGuard': {
            return {
                type: 'andGuard',
                guards: (g.guards as Guard[]).map(encodeGuard),
            };
        }
        case 'notGuard':
            return { type: 'notGuard', guard: encodeGuard(g.guard) };
        case 'taskGuard': {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { parent, ...rest } = g;
            return rest as TaskGuardWire;
        }
        case 'timerGuard': {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { parent, ...rest } = g;
            return rest as TimerGuardWire;
        }
    }
}

export const guardSchemaCodec = z.codec(guardWireSchema, guardSchema, {
    decode: (guard) => decodeGuard(guard, undefined),
    encode: (guardWire) => encodeGuard(guardWire as GuardWire),
});
