import type { UUID } from 'digital-fuesim-manv-shared';
import type { EntityManager } from 'typeorm';
import type { BaseEntity } from './entities/base-entity.js';
import type { DatabaseService } from './services/database-service.js';

export abstract class NormalType<
    TSelf extends NormalType<TSelf, EntityType>,
    EntityType extends BaseEntity<any, TSelf>,
> {
    protected constructor(
        protected readonly databaseService: DatabaseService
    ) {}
    public id?: UUID;

    public abstract asEntity(
        save: boolean,
        entityManager?: EntityManager
    ): Promise<EntityType>;

    /**
     * Creates or updates the object in the database
     */
    public async save(entityManager?: EntityManager): Promise<EntityType> {
        return this.asEntity(true, entityManager);
    }
}
