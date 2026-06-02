import {
    castImmutable,
    type Immutable,
    produce,
    type WritableDraft,
} from 'immer';
import { currentStateVersion, type ExerciseState } from '../state.js';
import { newExerciseState } from '../state.js';
import type { ParticipantKey } from '../exercise-keys.js';
import {
    type StateExport,
    type MigratedStateExport,
} from '../export-import/file-format/state-export.js';
import type { ExerciseAction } from '../store/action-reducers/action-reducers.js';
import {
    type MigratedPartialExport,
    newMigratedPartialExport,
    type PartialExport,
} from '../export-import/file-format/partial-export.js';
import { applyAction } from '../store/reduce-exercise-state.js';
import { ReducerError } from '../store/reducer-error.js';
import type { UUID } from '../utils/uuid.js';
import { cloneDeepMutable } from '../utils/clone-deep.js';
import { validateExerciseState } from '../store/validate-exercise-state.js';
import { migrations } from './migration-functions.js';
import type { Migration } from './migration-functions.js';

export function migrateStateExport(
    stateExport: StateExport
): MigratedStateExport {
    const { currentState, history } = applyMigrations(stateExport.dataVersion, {
        currentState: stateExport.currentState,
        history: stateExport.history,
    });

    const migratedHistory =
        stateExport.history && history
            ? {
                  actionHistory: history.actions.filter(
                      // Remove actions that are marked to be removed by the migrations
                      (action): action is WritableDraft<ExerciseAction> =>
                          action !== null
                  ),
                  initialState: history.initialState,
              }
            : undefined;
    return {
        ...stateExport,
        dataVersion: currentStateVersion,
        currentState,
        history: migratedHistory,
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
export function applyMigrations<
    H extends
        | { initialState: object; actionHistory: (object | null)[] }
        | undefined,
>(
    dataVersion: number,
    propertiesToMigrate: {
        currentState: Immutable<object>;
        history: Immutable<H>;
    }
): {
    currentState: ExerciseState;
    history: H extends undefined
        ? undefined
        :
              | {
                    initialState: ExerciseState;
                    actions: (ExerciseAction | null)[];
                }
              | undefined;
} {
    const migrationsToApply: Migration[] = [];
    for (let i = dataVersion + 1; i <= currentStateVersion; i++) {
        migrationsToApply.push(migrations[i]!);
    }

    const history = propertiesToMigrate.history;
    if (history) {
        const intermediaryState = migrateState(
            migrationsToApply,
            history.initialState
        );
        validateExerciseState(intermediaryState);
        try {
            const actionsAppliedProperties = produce(
                { intermediaryState, actionHistory: history.actionHistory },
                (draft) => {
                    draft.actionHistory.forEach((action, index) => {
                        if (action !== null) {
                            const deleteAction = !migrateAction(
                                migrationsToApply, // TODO validate state here
                                castImmutable(intermediaryState),
                                action
                            );
                            if (!deleteAction) {
                                try {
                                    applyAction(
                                        draft.intermediaryState,
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
                                draft.actionHistory[index] = null;
                            }
                        }
                    });
                }
            );
            validateExerciseState(actionsAppliedProperties.intermediaryState);
            return {
                currentState: actionsAppliedProperties.intermediaryState,
                history: actionsAppliedProperties.actionHistory as any,
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
    validateExerciseState(currentState);
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
    return stateToMigrate as ExerciseState;
}

/**
 * @returns true if all went well and false if the action should be deleted
 */
function migrateAction(
    migrationsToApply: Migration[],
    intermediaryState: ExerciseState,
    action: object
): boolean {
    return migrationsToApply.every((migration) => {
        if (migration.action) {
            return migration.action(intermediaryState, action);
        }
        return true;
    });
}
