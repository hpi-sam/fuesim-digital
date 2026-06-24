# Shared

This package contains utility functions, classes, types, etc. that are shared between the frontend and the backend.

Keep in mind to add new exports to the `index.ts` file in the folde r.

## Architecture

- [src/data/](./src/data) data like default objects for the state or dummy objects for testing
- [src/export-import/](./src/export-import/) contains schemas for export and import files
- [src/models/](./src/models) schemas and their types that are used in the [state](./src/state.ts)
- [src/socket-api/](./src/socket-api) the types for [socket.io](https://socket.io/docs/v4/typescript/)
- [src/state-helpers/](./src/state-helpers) utilities for working with the state.
- [src/state-migrations/](./src/state-migrations) migrations to update old states and actions to the newest version.
- [src/store/](./src/store) reducers, actions and utilities that are used with the state
- [src/utils/](./src/utils) general utilities

## Updates to state schema and migrations

Note that whenever the state types get updated you have to increase `currentStateVersion` in [`state.ts`](./src/state.ts).

In addition, you have to add a migration in [`state-migrations`](./src/state-migrations). Look at [`./src/state-migrations/migration-functions.ts`](./src/state-migrations/migration-functions.ts) for more information.
To test the migrations, you can use the benchmarks in [`../benchmark`](../benchmark) and look for errors.

## Adding new actions

When writing new actions, note the comments in [src/store/action-reducer.ts](./src/store/action-reducer.ts) and [src/store/action-reducers/action-reducers.ts](./src/store/action-reducers/action-reducers.ts).
You can orient yourself at the already existing actions in [src/store/action-reducers](./src/store/action-reducers/).
Note especially that new actions have to be registered in `actionReducers` in [src/store/action-reducers/action-reducers.ts](./src/store/action-reducers/action-reducers.ts).

## Adding new models

When adding new models to the state, you should write a new schema within [src/models](src/models) and add a new attribute to the [exercise state](src/state.ts).

## Validation

We are using [Zod](zod.dev) schemas for validating all elements in the `state` and all actions.
It is desirable to narrow down the types of the validation as much as possible, within reason.
