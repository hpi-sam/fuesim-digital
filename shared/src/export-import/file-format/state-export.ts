import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { type WritableDraft } from 'immer';
import { ExerciseState } from '../../state.js';
import type { ExerciseAction } from '../../store/action-reducers/action-reducers.js';
import { IsExerciseAction } from '../../store/validate-exercise-action.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { BaseExportImportFile } from './base-file.js';

export class StateHistoryCompound {
    @IsArray()
    @IsExerciseAction({ each: true })
    public actionHistory: ExerciseAction[];

    @ValidateNested()
    @Type(() => ExerciseState)
    public initialState: WritableDraft<ExerciseState>;

    public constructor(
        actionHistory: ExerciseAction[],
        initialState: WritableDraft<ExerciseState>
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
    public override currentState: WritableDraft<ExerciseState>;

    public constructor(
        currentState: WritableDraft<ExerciseState>,
        stateHistory?: StateHistoryCompound
    ) {
        super(currentState, stateHistory);
        this.currentState = currentState;
    }
}
