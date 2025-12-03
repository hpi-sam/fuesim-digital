import { ExerciseState } from '../state.js';
import type { ExerciseAction } from '../store/index.js';
import { ReducerError, applyAction } from '../store/index.js';
import type { Mutable, UUID } from '../utils/index.js';
import { cloneDeepMutable } from '../utils/index.js';
import {
    PartialExport,
    CompleteExport,
} from '../export-import/file-format/index.js';
import type { MapImageTemplate, VehicleTemplate } from '../models/index.js';
import type { PatientCategory } from '../models/patient-category.js';
import type { Migration } from './migration-functions.js';
import { migrations } from './migration-functions.js';

/**
 * Migrates a {@link CompleteExport} to the current state version
 * @param completeExportToMigrate The export to migrate
 * @returns An export object that is compatible with the current state version
 */
export function migrateCompleteExport(
    completeExportToMigrate: CompleteExport
): Mutable<CompleteExport> {
    const stateExport = cloneDeepMutable(completeExportToMigrate);
    const {
        newVersion,
        migratedProperties: { currentState, history },
    } = applyMigrations(stateExport.dataVersion, {
        currentState: stateExport.currentState,
        history: stateExport.history
            ? {
                  initialState: stateExport.history.initialState,
                  actions: stateExport.history.actionHistory,
              }
            : undefined,
    });

    stateExport.dataVersion = newVersion;
    stateExport.currentState = currentState;
    if (stateExport.history) {
        if (history) {
            stateExport.history = {
                actionHistory: history.actions.filter(
                    // Remove actions that are marked to be removed by the migrations
                    (action): action is Mutable<ExerciseAction> =>
                        action !== null
                ),
                initialState: history.initialState,
            };
        } else {
            stateExport.history = undefined;
        }
    }
    return stateExport;
}

/**
 * Migrates a {@link PartialExport} to the current state version
 * @param partialExportToMigrate The export to migrate
 * @returns An export object that is compatible with the current state version
 */
export function migratePartialExport(
    partialExportToMigrate: PartialExport
): Mutable<PartialExport> {
    // Encapsulate the partial export in a state export and migrate it
    const mutablePartialExport = cloneDeepMutable(partialExportToMigrate);
    const stateExport = cloneDeepMutable(
        new CompleteExport({
            ...cloneDeepMutable(ExerciseState.create('123456')),
            mapImageTemplates: mutablePartialExport.mapImageTemplates ?? [],
            patientCategories: mutablePartialExport.patientCategories ?? [],
            vehicleTemplates: mutablePartialExport.vehicleTemplates ?? [],
        })
    );
    stateExport.fileVersion = mutablePartialExport.fileVersion;
    stateExport.dataVersion = mutablePartialExport.dataVersion;
    const migratedStateExport = migrateCompleteExport(
        stateExport as CompleteExport
    );
    // Check for `undefined` in the original partial export here as `undefined` has the meaning of `no changes`
    // compared to `[]` with the meaning of `nothing`. If later choosing to override using this partial export,
    // `undefined` will be ignored while `[]` would remove all existing entries.
    const mapImageTemplates =
        mutablePartialExport.mapImageTemplates !== undefined
            ? (migratedStateExport.currentState
                  .mapImageTemplates as MapImageTemplate[])
            : undefined;
    const patientCategories =
        mutablePartialExport.patientCategories !== undefined
            ? (migratedStateExport.currentState
                  .patientCategories as PatientCategory[])
            : undefined;
    const vehicleTemplates =
        mutablePartialExport.vehicleTemplates !== undefined
            ? (migratedStateExport.currentState
                  .vehicleTemplates as VehicleTemplate[])
            : undefined;
    const migratedPartialExport = new PartialExport(
        patientCategories,
        vehicleTemplates,
        mapImageTemplates
    );
    return cloneDeepMutable(migratedPartialExport);
}

/**
 * An optional, not migrated {@link StateHistoryCompound}
 */
type History = { initialState: object; actions: (object | null)[] } | undefined;

type MigratedHistory<H extends History> = H extends undefined
    ? undefined
    :
          | {
                initialState: MigratedState<'current'>;
                actions: (Mutable<ExerciseAction> | null)[];
            }
          | undefined;

/**
 * An optional, not migrated {@link CompleteExport}
 */
interface PropertiesToMigrate<H extends History> {
    currentState: object;
    history: H;
}

/**
 * The target version of a migration.
 *
 * Can be `current` (the current state version) or `intermediary` (a state version prior to the current version)
 */
type Target = 'current' | 'intermediary';

type MigratedState<T extends Target> = T extends 'current'
    ? Mutable<ExerciseState>
    : object;

interface MigratedProperties<H extends History, T extends Target> {
    currentState: MigratedState<T>;
    history: T extends 'current' ? MigratedHistory<H> : H | undefined;
}

/**
 * Migrates {@link propertiesToMigrate} to the newest version ({@link ExerciseState.currentStateVersion})
 * Might mutate the input.
 * @returns The new state version
 */
export function applyMigrations<H extends History>(
    currentStateVersion: number,
    propertiesToMigrate: PropertiesToMigrate<H>
): {
    newVersion: number;
    migratedProperties: MigratedProperties<H, 'current'>;
} {
    const targetVersion = ExerciseState.currentStateVersion;

    let intermediaryProperties: MigratedProperties<
        H | undefined,
        'intermediary'
    > = propertiesToMigrate;

    for (let i = currentStateVersion + 1; i <= targetVersion; i++) {
        intermediaryProperties = applySingleMigration(
            migrations[i]!,
            intermediaryProperties
        );
    }

    return {
        newVersion: targetVersion,
        migratedProperties: {
            currentState:
                intermediaryProperties.currentState as Mutable<ExerciseState>,
            history: intermediaryProperties.history as MigratedHistory<H>,
        },
    };
}

function applySingleMigration<H extends History>(
    migration: Migration,
    propertiesToMigrate: PropertiesToMigrate<H>
): MigratedProperties<H, 'intermediary'> {
    const history = propertiesToMigrate.history;

    if (history) {
        if (migration.state) migration.state(history.initialState);

        const intermediaryState = cloneDeepMutable(
            history.initialState
        ) as Mutable<ExerciseState>;

        try {
            history.actions.forEach((action, index) => {
                if (action !== null) {
                    const deleteAction = migration.action
                        ? migration.action(intermediaryState, action)
                        : false;

                    if (!deleteAction) {
                        try {
                            applyAction(
                                intermediaryState,
                                action as ExerciseAction
                            );
                        } catch (e: unknown) {
                            if (e instanceof ReducerError) {
                                const json = JSON.stringify(action);
                                console.warn(
                                    `Error while applying action ${json}: ${e.message}`
                                );
                            }
                            throw e;
                        }
                    } else {
                        history.actions[index] = null;
                    }
                }
            });

            // Remove actions that are marked to be removed by the migrations
            history.actions = history.actions.filter(
                (action) => action !== null
            );

            return {
                currentState: intermediaryState,
                history,
            };
        } catch (e: unknown) {
            if (e instanceof ReducerError) {
                // Fall back to migrating currentState instead of recreating it from history
                const exerciseId = (history.initialState as { id: UUID }).id;
                console.warn(
                    `Discarding history of exercise ${exerciseId} due to error in applying actions: ${e.message}`,
                    e.stack
                );
            } else {
                throw e;
            }
        }
    }

    if (migration.state) migration.state(propertiesToMigrate.currentState);

    return {
        currentState: propertiesToMigrate.currentState,
        history: undefined,
    };
}
