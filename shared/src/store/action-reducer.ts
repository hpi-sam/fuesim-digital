import type { Immutable, WritableDraft } from 'immer';
import type { ZodType } from 'zod';
import type { Client } from '../models/client.js';
import type { Role, SpecificRole } from '../models/utils/role.js';
import type { ExerciseState } from '../state.js';
import type { Constructor } from '../utils/constructor.js';

interface BaseActionReducer<A extends Action = Action> {
    readonly reducer: ReducerFunction<A>;
    readonly rights: ReducerRights<A>;
}

interface LegacyActionReducer<A extends Action = Action>
    extends BaseActionReducer<A> {
    readonly action: Constructor<A>;
}

interface SchemaBasedActionReducer<A extends Action = Action>
    extends BaseActionReducer<A> {
    readonly type: A['type'];
    readonly actionSchema: ZodType<A>;
}

export type ActionReducer<A extends Action = Action> =
    | LegacyActionReducer<A>
    | SchemaBasedActionReducer<A>;

/**
 *  An action is an interface for immutable JSON objects used to update the store in the frontend and
 *  are send to the backend to apply the changes there too.
 *
 *  The classes themself should only be used to validate the JSON objects in the backend, not to create them.
 *  Instead you should use the classes solely as interfaces and instantiate them like this:
 *  ```ts
 *  const action: RemoveViewport = {
 *      type: '[Viewport] Remove viewport',
 *      viewportId: 'some-uuid',
 *  };
 *  ```
 *
 *  The constructor of an Action must be callable without any arguments, to allow getting their type-value to
 *  validate the action objects in the backend.
 *  The properties of an Action must be decorated with class-validator decorators to allow validating them in the backend.
 */
export interface Action {
    readonly type: `[${string}] ${string}`;
}

/**
 * A pure function that applies the action on the provided state.
 * A [pure function](https://en.wikipedia.org/wiki/Pure_function) is a function that produces the same return value for identical arguments (doesn't use non-deterministic functions like `Date.now()`, `uuid()` or `Math.random()`) and is side-effect free.
 *
 * @throws {ReducerError} if the action is not applicable on the provided state
 *
 * It is expected to be used inside [immers produce](https://immerjs.github.io/immer/produce).
 *
 * Do not use [original()](https://immerjs.github.io/immer/original)!
 * `original(draftState)` could be any previous state when multiple reducers are applied (time travel).
 *
 * You can also call other reducers from within a reducer function (don't create loops).
 *
 * Example:
 * ```ts
 * const anAction: ExerciseAction = { type: 'some action' };
 * exerciseReducerMap[anAction.type](draftState, anAction);
 * ```
 *
 *
 * Be aware that the action is immutable!
 * [While TypeScript allows assigning immutable objects to properties of mutable objects](https://github.com/microsoft/TypeScript/issues/13347),
 * we have an eslint rule that shields against this.
 * You must always clone parts of the action before assigning them to the draftState.
 * The same could also apply for objects created inside the reducer function - like with a `Model.create()`, which by default returns an immutable object.
 *
 * Example:
 * ```ts
 * const reducerFunction = (draftState, anAction) =>  {
 *     draftState.someObject = cloneDeepMutable(anAction.someObject);
 *     draftState.someOtherObject = cloneDeepMutable(SomeOtherObject.create());
 *     return draftState;
 * }
 * ```
 *
 */
type ReducerFunction<A extends Action> = (
    // These functions can only work with a mutable state object, because we expect them to be executed in immers produce context.
    draftState: WritableDraft<ExerciseState>,
    action: Immutable<A>
) => WritableDraft<ExerciseState>;

export type ReducerRights<A extends Action> =
    | Role
    | SpecificRole
    | boolean
    | 'server'
    | ((client: Client, action: A) => Role | SpecificRole | boolean | 'server');
