import { Type } from 'class-transformer';
import {
    ValidateNested,
    IsJSON,
    IsUUID,
    IsOptional,
    IsInt,
} from 'class-validator';
import type { ExerciseAction, UUID } from 'digital-fuesim-manv-shared';
import { uuidValidationOptions } from 'digital-fuesim-manv-shared';
import type { EntityManager } from 'typeorm';
import { Entity, ManyToOne, Column } from 'typeorm';
import type { ActionWrapper } from '../../exercise/action-wrapper.js';
import type { DatabaseService } from '../services/database-service.js';
import { BaseEntity } from './base-entity.js';
import { ExerciseWrapperEntity } from './exercise-wrapper.entity.js';

@Entity()
export class ActionWrapperEntity extends BaseEntity<
    ActionWrapperEntity,
    ActionWrapper
> {
    /**
     * `null` iff the emitter was the server
     */
    @Column({ type: 'uuid', nullable: true })
    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    public emitterId!: UUID | null;

    @ManyToOne(() => ExerciseWrapperEntity, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        nullable: false,
        // We don't need the exercise on this side, we just need the inverse side of ExerciseWrapperEntity.actions
        eager: false,
    })
    @ValidateNested()
    @Type(() => ExerciseWrapperEntity)
    public exercise!: ExerciseWrapperEntity;

    @Column({ type: 'bigint' })
    @IsInt()
    public index!: number;

    @Column({
        type: 'json',
    })
    @IsJSON()
    public actionString!: string;

    private constructor() {
        super();
    }

    /**
     * Be very careful when using this. - Use {@link create} instead for most use cases.
     * This method does not guarantee a valid entity.
     */
    public static createNew() {
        return new ActionWrapperEntity();
    }

    public static async create(
        action: ExerciseAction,
        emitterId: UUID | null,
        exercise: ExerciseWrapperEntity,
        index: number,
        databaseService: DatabaseService,
        manager?: EntityManager
    ): Promise<ActionWrapperEntity> {
        const create = databaseService.actionWrapperService.getCreate({
            actionString: JSON.stringify(action),
            emitterId,
            exerciseId: exercise.id,
            index,
        });
        return manager ? create(manager) : databaseService.transaction(create);
    }
}
