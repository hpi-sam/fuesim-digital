import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ExerciseState } from '../../state.js';
import type { Mutable } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { ExerciseAction } from '../../store/action-reducers/action-reducers.js';
import { IsExerciseAction } from '../../store/validate-exercise-action.js';
import { BaseExportImportFile } from './base-file.js';

/**
 * A combination of an initial {@link ExerciseState} ({@link initialState}) and a list of actions ({@link actionHistory})
 * that together describe the full history of an exercise.
 */
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

/**
 * A full exercise export that contains at least the {@link currentState} of the exercise at the time of the export.
 *
 * Optionally, it can also contain a {@link history} consisting of the initial state and a list of actions that will lead to the {@link currentState}.
 */
export class CompleteExport extends BaseExportImportFile {
    @IsValue('complete' as const)
    public readonly type: 'complete' = 'complete';

    @ValidateNested()
    @Type(() => ExerciseState)
    public currentState: Mutable<ExerciseState>;

    @IsOptional()
    @ValidateNested()
    @Type(() => StateHistoryCompound)
    public readonly history?: StateHistoryCompound;

    public constructor(
        currentState: Mutable<ExerciseState>,
        stateHistory?: StateHistoryCompound
    ) {
        super();
        this.currentState = currentState;
        this.history = stateHistory;
    }
}
