import { DatabaseService } from '../services/database-service.js';
import { exerciseTable } from './../schema.js';

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
        const deleteResult = await manager.delete(exerciseTable).returning();

        console.log(`Successfully deleted ${deleteResult.length} exercises.`);

        const remaining = await manager.select().from(exerciseTable);
        console.log(`${remaining.length} exercises remaining in database.`);
    } catch (error) {
        console.error('Error during purge operation:', error);
    }
});
