# Shared

This package contains utility functions, classes, types, etc. that are shared between the frontend and the backend.

Keep in mind to add new exports to the `index.ts` file in the folder.

## Architecture

- [src/data/](./src/data) data like default objects for the state or dummy objects for testing
- [src/export-import/](./src/export-import/) contains typings for export and import files
- [src/models/](./src/models) classes, interfaces and types that are used in the [state](./src/state.ts)
    - Note that in all cases (other than validation) plain objects of these classes have to be used (instead of instance objects). You can use the `create` methods of all models for this.
- [src/socket-api/](./src/socket-api) the types for [socket.io](https://socket.io/docs/v4/typescript/)
- [src/state-helpers/](./src/state-helpers) utilities for working with the state.
- [src/state-migrations/](./src/state-migrations) migrations to update old states and actions to the newest version.
- [src/store/](./src/store) reducers, actions and utilities that are used with the state
- [src/utils/](./src/utils) general utilities

## Updates to state types and migrations

Note that whenever the state types get updated you have to increase `ExerciseState.currentStateVersion` in [`state.ts`](./src/state.ts).

In addition, you have to add a migration in [`state-migrations`](./src/state-migrations). Look at [`./src/state-migrations/migration-functions.ts`](./src/state-migrations/migration-functions.ts) for more information.
To test the migrations, you can use the benchmarks in [`../benchmark`](../benchmark) and look for errors.

## Adding new `Action`s

When writing new `Action`s, note the comments in [src/store/action-reducer.ts](./src/store/action-reducer.ts) and [src/store/action-reducers/action-reducers.ts](./src/store/action-reducers/action-reducers.ts).
You can orient yourself at the already existing `Action`s in [src/store/action-reducers](./src/store/action-reducers/).
Note especially that new `Action`s have to be registered in `actionReducers` in [src/store/action-reducers/action-reducers.ts](./src/store/action-reducers/action-reducers.ts).

## Adding new models

When adding new models note that they must expose a `static` `create` method that calls the constructor, removes the prototype and freezes the object.
This can be achieved by using `static create = getCreate(this)`, like in existing models.
Also, mark the `constructor` as `deprecated` via a JSDoc comment.

## Validation

We are using [`class-validator`](https://github.com/typestack/class-validator) for validating all elements in the `state` and all `Action`s.
The conversion to instance objects is done with [class-transformer](https://github.com/typestack/class-transformer).
It is desirable to narrow down the types of the validation as much as possible, within reason.
Note that we are currently not able to validate any kind of plain objects (e.g. `{ [key: string]: SomeModel }`) and union types (e.g. `'and' | 'or'`).
This is tracked in [#116](https://github.com/hpi-sam/fuesim-digital/issues/116).
