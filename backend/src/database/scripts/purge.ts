import { DatabaseService } from '../services/database-service.js';
import { exerciseWrapperTable } from './../schema.js';

const databaseService = await DatabaseService.createNewDatabaseConnection();

await databaseService.databaseConnection.transaction(async (manager) => {
    if (
        DatabaseService.isInMemoryConnection(databaseService.databaseConnection)
    ) {
        console.warn(
            'PURGING IN-MEMORY DATABASE! --> Set DFM_USE_DB=true to purge Postgres Database.'
        );
    }
    const deleteResult = await databaseService.databaseConnection
        .delete(exerciseWrapperTable)
        .returning();

    console.log(`Successfully deleted ${deleteResult.length} exercises.`);

    const remaining = await databaseService.databaseConnection
        .select()
        .from(exerciseWrapperTable);
    console.log(`${remaining.length} exercises remaining in database.`);
});
