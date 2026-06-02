import { z } from 'zod';
import type { Immutable } from 'immer';
import { type ExerciseState } from '../../state.js';
import type { ExerciseAction } from '../../store/action-reducers/action-reducers.js';
import { exportImportFileSchema } from './export-import-file.js';

export const stateHistoryCompoundSchema = z.object({
    actionHistory: z.array(z.object()),
    /*
 This can be some arbitrary object because we can get an invalid or not migrated state
  */
    initialState: z.object(),
});
export type StateHistoryCompound = Immutable<
    z.infer<typeof stateHistoryCompoundSchema>
>;

export interface MigratedStateHistoryCompound {
    readonly actionHistory: readonly ExerciseAction[];
    /*
        This can be some arbitrary object because we can get an invalid or not migrated state
     */
    readonly initialState: ExerciseState;
}

export const stateExportSchema = z.object({
    ...exportImportFileSchema.shape,
    type: z.literal('complete'),
    /*
        This can be some arbitrary object because we can get an invalid or not migrated state
     */
    currentState: z.any(),
    history: stateHistoryCompoundSchema.optional(),
});

export type StateExport = Immutable<z.infer<typeof stateExportSchema>>;

export interface MigratedStateExport {
    readonly type: 'complete';
    readonly fileVersion: number;
    readonly dataVersion: number;
    readonly currentState: ExerciseState;
    readonly history?: MigratedStateHistoryCompound;
}
