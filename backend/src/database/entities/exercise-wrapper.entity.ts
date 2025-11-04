import { IsInt, IsJSON, IsString, MinLength, MaxLength } from 'class-validator';
import { ExerciseState } from 'digital-fuesim-manv-shared';
import { Entity, Column } from 'typeorm';
import type { ExerciseWrapper } from '../../exercise/exercise-wrapper.js';
import type { DatabaseService } from '../services/database-service.js';
import type { ActionWrapperEntity } from './action-wrapper.entity.js';
import { BaseEntity } from './base-entity.js';

@Entity()
export class ExerciseWrapperEntity extends BaseEntity<
    ExerciseWrapperEntity,
    ExerciseWrapper
> {
    @Column({
        type: 'integer',
        default: 0,
    })
    @IsInt()
    public tickCounter = 0;

    @Column({
        type: 'json',
    })
    @IsJSON()
    public initialStateString!: string;

    @Column({ type: 'char', length: 6 })
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    public participantId!: string;

    @Column({ type: 'char', length: 8 })
    @IsString()
    @MinLength(8)
    @MaxLength(8)
    public trainerId!: string;

    @Column({
        type: 'json',
    })
    @IsJSON()
    public currentStateString!: string;

    @Column({ type: 'integer', default: 0 })
    @IsInt()
    public stateVersion!: number;

    // This is not used by typeorm as this would clash with the approach of not saving every action in RAM.
    public actions?: ActionWrapperEntity[];

    private constructor() {
        super();
    }

    /**
     * Be very careful when using this. - Use {@link create} instead for most use cases.
     * This method does not guarantee a valid entity.
     */
    public static createNew() {
        return new ExerciseWrapperEntity();
    }

    public static async create(
        participantId: string,
        trainerId: string,
        databaseService: DatabaseService,
        initialState: ExerciseState = ExerciseState.create(participantId),
        currentState: ExerciseState = initialState
    ): Promise<ExerciseWrapperEntity> {
        return databaseService.transaction(
            databaseService.exerciseWrapperService.getCreate({
                participantId,
                trainerId,
                initialStateString: JSON.stringify(initialState),
                currentStateString: JSON.stringify(currentState),
                stateVersion: ExerciseState.currentStateVersion,
            })
        );
    }
}
