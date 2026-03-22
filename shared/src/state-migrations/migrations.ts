import type { WritableDraft } from 'immer';
import { ExerciseState } from '../state.js';
import type { ParticipantKey } from '../exercise-keys.js';
import {
    StateExport,
    type MigratedStateExport,
} from '../export-import/file-format/state-export.js';
import { cloneDeepMutable } from '../utils/clone-deep.js';
import type { ExerciseAction } from '../store/action-reducers/action-reducers.js';
import { PartialExport } from '../export-import/file-format/partial-export.js';
import { applyAction } from '../store/reduce-exercise-state.js';
import { ReducerError } from '../store/reducer-error.js';
import type { UUID } from '../utils/uuid.js';
import { migrations } from './migration-functions.js';
import type { Migration } from './migration-functions.js';

export function migrateStateExport(
    stateExportToMigrate: StateExport
): WritableDraft<MigratedStateExport> {
    const stateExport = cloneDeepMutable(
        stateExportToMigrate
    ) as WritableDraft<MigratedStateExport>;
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
                    (action): action is WritableDraft<ExerciseAction> =>
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
export function migratePartialExport(
    partialExportToMigrate: PartialExport,
    currentState: ExerciseState
): WritableDraft<PartialExport> {
    // Encapsulate the partial export in a state export and migrate it
    const mutablePartialExport = cloneDeepMutable(partialExportToMigrate);
    const dummyState = cloneDeepMutable(
        ExerciseState.create('123456' as ParticipantKey)
    );
    const stateExport = cloneDeepMutable(
        new StateExport({
            ...dummyState,
            mapImageTemplates: mutablePartialExport.mapImageTemplates ?? [],
            patientCategories: mutablePartialExport.patientCategories ?? [],
            vehicleTemplates: mutablePartialExport.vehicleTemplates ?? [],
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
        })
    );
    stateExport.fileVersion = mutablePartialExport.fileVersion;
    stateExport.dataVersion = mutablePartialExport.dataVersion;
    const migratedStateExport = migrateStateExport(stateExport as StateExport);
    // Check for `undefined` in the original partial export here as `undefined` has the meaning of `no changes`
    // compared to `[]` with the meaning of `nothing`. If later choosing to override using this partial export,
    // `undefined` will be ignored while `[]` would remove all existing entries.
    const mapImageTemplates =
        mutablePartialExport.mapImageTemplates !== undefined
            ? Object.values(migratedStateExport.currentState.mapImageTemplates)
            : undefined;
    const patientCategories =
        mutablePartialExport.patientCategories !== undefined
            ? migratedStateExport.currentState.patientCategories
            : undefined;
    let vehicleTemplates =
        mutablePartialExport.vehicleTemplates !== undefined
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

    const migratedPartialExport = new PartialExport(
        patientCategories,
        vehicleTemplates,
        mapImageTemplates
    );
    return cloneDeepMutable(migratedPartialExport);
}

/**
 * Migrates {@link propertiesToMigrate} to the newest version ({@link ExerciseState.currentStateVersion})
 * Might mutate the input.
 * @returns The new state version
 */
export function applyMigrations<
    H extends { initialState: object; actions: (object | null)[] } | undefined,
>(
    currentStateVersion: number,
    propertiesToMigrate: {
        currentState: object;
        history: H;
    }
): {
    newVersion: number;
    migratedProperties: {
        currentState: WritableDraft<ExerciseState>;
        history: H extends undefined
            ? undefined
            :
                  | {
                        initialState: WritableDraft<ExerciseState>;
                        actions: (WritableDraft<ExerciseAction> | null)[];
                    }
                  | undefined;
    };
} {
    const newVersion = ExerciseState.currentStateVersion;

    const migrationsToApply: Migration[] = [];
    for (let i = currentStateVersion + 1; i <= newVersion; i++) {
        migrationsToApply.push(migrations[i]!);
    }

    const history = propertiesToMigrate.history;
    if (history) {
        migrateState(migrationsToApply, history.initialState);
        const intermediaryState = cloneDeepMutable(
            history.initialState
        ) as WritableDraft<ExerciseState>;
        try {
            history.actions.forEach((action, index) => {
                if (action !== null) {
                    const deleteAction = !migrateAction(
                        migrationsToApply,
                        intermediaryState,
                        action
                    );
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
            return {
                newVersion,
                migratedProperties: {
                    currentState: intermediaryState,
                    // history has been migrated in place
                    history: history as any,
                },
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
    migrateState(migrationsToApply, propertiesToMigrate.currentState);
    const currentState =
        propertiesToMigrate.currentState as WritableDraft<ExerciseState>;
    return {
        newVersion,
        migratedProperties: {
            currentState,
            history: undefined as any,
        },
    };
}

function migrateState(migrationsToApply: Migration[], currentState: object) {
    migrationsToApply.forEach((migration) => {
        if (migration.state) migration.state(currentState);
    });
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
