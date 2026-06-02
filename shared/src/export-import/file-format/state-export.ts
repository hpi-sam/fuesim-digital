import { Type } from 'class-transformer';
import {
    IsArray,
    IsInt,
    IsObject,
    IsOptional,
    Min,
    ValidateNested,
} from 'class-validator';
import { z } from 'zod';
import type { Immutable } from 'immer';
import {
    currentStateVersion,
    type ExerciseState,
    exerciseStateSchema,
} from '../../state.js';
import type { ExerciseAction } from '../../store/action-reducers/action-reducers.js';
import { IsExerciseAction } from '../../store/validate-exercise-action.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
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

export class MigratedStateHistoryCompound {
    @IsArray()
    @IsExerciseAction({ each: true })
    public actionHistory: ExerciseAction[];

    /*
    This can be some arbitrary object because we can get an invalid or not migrated state
     */
    @IsObject()
    public initialState: ExerciseState;

    public constructor(
        actionHistory: ExerciseAction[],
        initialState: ExerciseState
    ) {
        this.actionHistory = actionHistory;
        this.initialState = initialState;
    }
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

export class MigratedStateExport {
    @IsInt()
    @Min(0)
    public readonly fileVersion: number = 1;

    @IsInt()
    @Min(0)
    public readonly dataVersion: number = currentStateVersion;

    public readonly type: 'complete' = 'complete';

    @IsZodSchema(exerciseStateSchema)
    public currentState: ExerciseState;

    @IsOptional()
    @ValidateNested()
    @Type(() => MigratedStateHistoryCompound)
    public readonly history?: MigratedStateHistoryCompound;

    public constructor(
        currentState: ExerciseState,
        stateHistory?: MigratedStateHistoryCompound
    ) {
        this.currentState = currentState;
        this.history = stateHistory;
    }
}
