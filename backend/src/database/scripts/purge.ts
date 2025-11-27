import { exerciseWrapperTable } from 'database/schema.js';
import { DatabaseService } from '../services/database-service.js';

const dataSource = await DatabaseService.createNewDatabaseConnection();

const databaseService = new DatabaseService(dataSource);

await databaseService.transaction(async (manager) => {
    const deleteResult = await databaseService.delete(exerciseWrapperTable);

    // TODO: @Quixelation
    console.log(deleteResult);

    /* console.log(
        `Successfully deleted ${deleteResult.reduce(
            (currentAffectedCount, currentDeleteResult) =>
                currentAffectedCount + (currentDeleteResult.affected ?? 0),
            0
        )} of ${exercises.length} exercises.`
    );*/
});
