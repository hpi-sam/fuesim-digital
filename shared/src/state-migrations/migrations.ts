import { castImmutable, type Immutable, produce } from 'immer';
import { currentStateVersion, type ExerciseState } from '../state.js';
import { newExerciseState } from '../state.js';
import type { ParticipantKey } from '../exercise-keys.js';
import type {
    StateHistoryCompound,
    StateExport,
    MigratedStateExport,
    MigratedStateHistoryCompound,
} from '../export-import/file-format/state-export.js';
import type { ExerciseAction } from '../store/action-reducers/action-reducers.js';
import {
    type MigratedPartialExport,
    newMigratedPartialExport,
    type PartialExport,
} from '../export-import/file-format/partial-export.js';
import { applyAction } from '../store/reduce-exercise-state.js';
import { ReducerError } from '../store/reducer-error.js';
import { cloneDeepMutable } from '../utils/clone-deep.js';
import { validateExerciseState } from '../store/validate-exercise-state.js';
import { validateExerciseAction } from '../store/validate-exercise-action.js';
import type { UUID } from '../utils/uuid.js';
import { migrations } from './migration-functions.js';
import type { Migration } from './migration-functions.js';

export function migrateStateExport(
    stateExport: StateExport
): MigratedStateExport {
    const { currentState, history } = applyMigrations(stateExport.dataVersion, {
        currentState: stateExport.currentState,
        history: stateExport.history,
    });

    return {
        ...stateExport,
        dataVersion: currentStateVersion,
        currentState,
        history,
    };
}
export function migratePartialExport(
    partialExport: PartialExport,
    currentState: ExerciseState
): MigratedPartialExport {
    // Encapsulate the partial export in a state export and migrate it
    const dummyState = newExerciseState('123456' as ParticipantKey);
    const stateExport = {
        type: 'complete',
        currentState: {
            ...dummyState,
            mapImageTemplates: partialExport.mapImageTemplates ?? [],
            patientCategories: partialExport.patientCategories ?? [],
            vehicleTemplates: partialExport.vehicleTemplates ?? [],
            // We need this hotfix since otherwise migration 44 is not happy
            materialTemplates: Object.fromEntries(
                Object.entries(dummyState.materialTemplates).map(
                    ([id, template]) => [
                        id,
                        {
                            ...template,
                            materialType:
                                template.image.url === '/assets/material.svg'
                                    ? 'standard'
                                    : 'big',
                        },
                    ]
                )
            ),
        },
        fileVersion: partialExport.fileVersion,
        dataVersion: partialExport.dataVersion,
    } satisfies StateExport;

    const migratedStateExport = migrateStateExport(stateExport);

    // Check for `undefined` in the original partial export here as `undefined` has the meaning of `no changes`
    // compared to `[]` with the meaning of `nothing`. If later choosing to override using this partial export,
    // `undefined` will be ignored while `[]` would remove all existing entries.
    const mapImageTemplates =
        partialExport.mapImageTemplates !== undefined
            ? Object.values(migratedStateExport.currentState.mapImageTemplates)
            : undefined;
    const patientCategories =
        partialExport.patientCategories !== undefined
            ? migratedStateExport.currentState.patientCategories
            : undefined;
    let vehicleTemplates =
        partialExport.vehicleTemplates !== undefined
            ? Object.values(migratedStateExport.currentState.vehicleTemplates)
            : undefined;

    // Fix template id lookups, since migration 44 always computes new template IDs
    if (vehicleTemplates)
        vehicleTemplates = vehicleTemplates.map((t) => ({
            ...t,
            personnelTemplateIds: t.personnelTemplateIds.map((id) => {
                const requiredType =
                    migratedStateExport.currentState.personnelTemplates[id]!
                        .personnelType;
                return Object.values(currentState.personnelTemplates).find(
                    (pt) => pt.personnelType === requiredType
                )!.id;
            }),
            materialTemplateIds: t.materialTemplateIds.map((id) => {
                const requiredType =
                    migratedStateExport.currentState.materialTemplates[id]!
                        .image.url;
                return Object.values(currentState.materialTemplates).find(
                    (mt) => mt.image.url === requiredType
                )!.id;
            }),
        }));

    return newMigratedPartialExport(
        patientCategories,
        vehicleTemplates,
        mapImageTemplates
    );
}

/**
 * Migrates {@link propertiesToMigrate} to the newest version ({@link ExerciseState.currentStateVersion})
 * Might mutate the input.
 * @returns The new state version
 */
export function applyMigrations<H extends StateHistoryCompound | undefined>(
    dataVersion: number,
    propertiesToMigrate: {
        currentState: Immutable<object>;
        history: H;
    }
): {
    currentState: ExerciseState;
    history: H extends undefined
        ? undefined
        : MigratedStateHistoryCompound | undefined;
} {
    const migrationsToApply: Migration[] = [];
    for (let i = dataVersion + 1; i <= currentStateVersion; i++) {
        migrationsToApply.push(migrations[i]!);
    }

    const history = propertiesToMigrate.history;
    if (history !== undefined) {
        const migratedInitialState = migrateState(
            migrationsToApply,
            history.initialState
        );
        try {
            const migratedActionHistory: ExerciseAction[] = [];
            const currentState = produce(
                migratedInitialState,
                (intermediaryState) => {
                    history.actionHistory.forEach((action, index) => {
                        const migratedAction = migrateAction(
                            migrationsToApply,
                            castImmutable(migratedInitialState),
                            action
                        );
                        if (migratedAction === null) return;

                        migratedActionHistory.push(migratedAction);

                        try {
                            applyAction(intermediaryState, migratedAction);
                        } catch (e: unknown) {
                            if (e instanceof ReducerError) {
                                console.warn(
                                    `Error while applying action ${migratedAction.type}: ${e.message}`,
                                    migratedAction
                                );
                            }
                            throw e;
                        }
                    });
                }
            );
            return {
                currentState,
                history: {
                    actionHistory: migratedActionHistory,
                    initialState: migratedInitialState,
                } as any,
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
    const currentState = migrateState(
        migrationsToApply,
        propertiesToMigrate.currentState
    );
    return {
        currentState,
        history: undefined,
    };
}

function migrateState(
    migrationsToApply: Migration[],
    currentState: Immutable<object>
): ExerciseState {
    const stateToMigrate = cloneDeepMutable(currentState);
    migrationsToApply.forEach((migration) => {
        if (migration.state) migration.state(stateToMigrate);
    });
    return validateExerciseState(stateToMigrate);
}

/**
 * @returns migrated and validated action or null if the action should be deleted
 */
function migrateAction(
    migrationsToApply: Migration[],
    intermediaryState: ExerciseState,
    action: Immutable<object>
): ExerciseAction | null {
    const actionToMigrate = cloneDeepMutable(action);
    const shouldDelete = !migrationsToApply.every((migration) => {
        if (migration.action) {
            return migration.action(intermediaryState, actionToMigrate);
        }
        return true;
    });
    if (shouldDelete) return null;
    return validateExerciseAction(actionToMigrate);
}
