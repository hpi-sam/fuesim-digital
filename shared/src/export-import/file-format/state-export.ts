import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { type ExerciseState, exerciseStateSchema } from '../../state.js';
import type { ExerciseAction } from '../../store/action-reducers/action-reducers.js';
import { IsExerciseAction } from '../../store/validate-exercise-action.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { BaseExportImportFile } from './base-file.js';

export class StateHistoryCompound {
    @IsArray()
    public actionHistory: object[];

    /*
    This can be some arbitrary object because we can get an invalid or not migrated state
     */
    @IsObject()
    public initialState: object;

    public constructor(actionHistory: ExerciseAction[], initialState: object) {
        this.actionHistory = actionHistory;
        this.initialState = initialState;
    }
}

export class MigratedStateHistoryCompound extends StateHistoryCompound {
    @IsArray()
    @IsExerciseAction({ each: true })
    public override actionHistory: ExerciseAction[];

    /*
    This can be some arbitrary object because we can get an invalid or not migrated state
     */
    @IsObject()
    public override initialState: ExerciseState;

    public constructor(
        actionHistory: ExerciseAction[],
        initialState: ExerciseState
    ) {
        super(actionHistory, initialState);
        this.actionHistory = actionHistory;
        this.initialState = initialState;
    }
}

export class StateExport extends BaseExportImportFile {
    @IsValue('complete' as const)
    public readonly type: 'complete' = 'complete';

    /*
    This can be some arbitrary object because we can get an invalid or not migrated state
     */
    @IsObject()
    public currentState: object;

    @IsOptional()
    @ValidateNested()
    @Type(() => StateHistoryCompound)
    public readonly history?: StateHistoryCompound;

    public constructor(
        currentState: object,
        stateHistory?: StateHistoryCompound
    ) {
        super();
        this.currentState = currentState;
        this.history = stateHistory;
    }
}

export class MigratedStateExport extends StateExport {
    @IsZodSchema(exerciseStateSchema)
    public override currentState: ExerciseState;

    @IsOptional()
    @ValidateNested()
    @Type(() => MigratedStateHistoryCompound)
    public override readonly history?: MigratedStateHistoryCompound;

    public constructor(
        currentState: ExerciseState,
        stateHistory?: MigratedStateHistoryCompound
    ) {
        super(currentState, stateHistory);
        this.currentState = currentState;
        this.history = stateHistory;
    }
}
