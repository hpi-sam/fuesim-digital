import type { Constructor } from 'digital-fuesim-manv-shared';
import type {
    DatabaseConnection,
    DatabaseTransaction,
} from './../../database/services/database-service.js';

export abstract class BaseRepository {
    public constructor(
        protected readonly databaseConnection:
            | DatabaseConnection
            | DatabaseTransaction
    ) {}

    /**
     * Starts a new transaction
     *
     * @param operation function which receives the new repository with the updated database connection to the transaction
     * @returns
     */
    public async transaction<T>(
        operation: (service: typeof this) => Promise<T>
    ): Promise<T> {
        return this.databaseConnection.transaction(async (dbtx) => {
            const transactionboundService = this.withConnection(dbtx);
            return operation(transactionboundService);
        });
    }

    /**
     * Creates a new instance of this repository, using the new DatabaseConnection.
     *
     * This is for example used for transactions (also across repositories), so that
     * every function in the repository uses the transaction connection provided by
     * the orm during transactions.
     *
     * @param connection DatabaseConnection or Repository using a DatabaseConnection
     * @returns Copy of this repository with new DatabaseConnection
     */
    public withConnection(
        connection: BaseRepository | DatabaseConnection | DatabaseTransaction
    ): typeof this {
        let newConnection = connection;
        if (connection instanceof BaseRepository) {
            newConnection = connection.databaseConnection;
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const RepositoryClass = this.constructor as Constructor<typeof this>;
        return new RepositoryClass(newConnection);
    }
}
