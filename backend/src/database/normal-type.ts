import type { AnyPgTable } from 'drizzle-orm/pg-core';
import type { InferInsertModel } from 'drizzle-orm';
import type {
    DatabaseService,
    DatabaseTransaction,
} from './services/database-service.js';

export abstract class NormalType<Table extends AnyPgTable> {
    protected constructor(
        protected readonly databaseService: DatabaseService
    ) {}
    public entity!: InferInsertModel<Table>;

    /**
     * Creates or updates the object in the database
     */
    public abstract save(database?: DatabaseTransaction | null): Promise<any>;
}
