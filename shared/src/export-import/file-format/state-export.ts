import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { ExerciseState } from '../../state.js';
import type { Mutable } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { ExerciseAction } from '../../store/action-reducers/action-reducers.js';
import { IsExerciseAction } from '../../store/validate-exercise-action.js';
import { BaseExportImportFile } from './base-file.js';

export class StateHistoryCompound {
    @IsArray()
    @IsExerciseAction({ each: true })
    public actionHistory: ExerciseAction[];

    @ValidateNested()
    @Type(() => ExerciseState)
    public initialState: Mutable<ExerciseState>;

    public constructor(
        actionHistory: ExerciseAction[],
        initialState: Mutable<ExerciseState>
    ) {
        this.actionHistory = actionHistory;
        this.initialState = initialState;
    }
}

export class StateExport extends BaseExportImportFile {
    @IsValue('complete' as const)
    public readonly type: 'complete' = 'complete';

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
    @ValidateNested()
    @Type(() => ExerciseState)
    public override currentState: Mutable<ExerciseState>;

    public constructor(
        currentState: Mutable<ExerciseState>,
        stateHistory?: StateHistoryCompound
    ) {
        super(currentState, stateHistory);
        this.currentState = currentState;
    }
}
