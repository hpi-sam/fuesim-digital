import { DatabaseService } from '../services/database-service.js';
import { exerciseWrapperTable } from './../schema.js';

const dataSource = await DatabaseService.createNewDatabaseConnection();

const databaseService = new DatabaseService(dataSource);

await databaseService.transaction(async (manager) => {
    if (DatabaseService.isInMemoryConnection(dataSource)) {
        console.warn(
            'PURGING IN-MEMORY DATABASE! --> Set DFM_USE_DB=true to purge Postgres Database.'
        );
    }
    const deleteResult = await databaseService
        .delete(exerciseWrapperTable)
        .returning();

    console.log(`Successfully deleted ${deleteResult.length} exercises.`);

    const remaining = await databaseService.select().from(exerciseWrapperTable);
    console.log(`${remaining.length} exercises remaining in database.`);
});
