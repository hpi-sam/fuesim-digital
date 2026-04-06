import { reset } from 'drizzle-seed';
import { DatabaseService } from '../services/database-service.js';
import * as schema from '../schema.js';

const databaseService = await DatabaseService.createNewDatabaseConnection();

databaseService.databaseConnection.transaction(async (manager) => {
    if (
        DatabaseService.isInMemoryConnection(databaseService.databaseConnection)
    ) {
        console.warn(
            'PURGING IN-MEMORY DATABASE! Set DFM_USE_DB=true to purge PostgreSQL database.'
        );
    }
    try {
        await reset(databaseService.databaseConnection, schema);

        console.log(`Successfully purged the database.`);
    } catch (error) {
        console.error('Error during purge operation:', error);
    }
});
