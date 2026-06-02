import { z } from 'zod';
import type { Immutable } from 'immer';
import { exerciseStateSchema } from '../../state.js';
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

export const migratedStateHistoryCompoundSchema = z.object({
    actionHistory: z.array(exerciseActionSchema),
    /*
    This can be some arbitrary object because we can get an invalid or not migrated state
     */
    initialState: exerciseStateSchema,
});
export type MigratedStateHistoryCompound = Immutable<
    z.infer<typeof migratedStateHistoryCompoundSchema>
>;

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

export const migratedStateExportSchema = z.object({
    ...exportImportFileSchema.shape,
    currentState: exerciseStateSchema,
    history: migratedStateHistoryCompoundSchema.optional(),
});
export type MigratedStateExport = Immutable<
    z.infer<typeof migratedStateExportSchema>
>;
