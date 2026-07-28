import { parseArgs } from 'node:util';
import { Config } from '../../config.js';
import { UserRepository } from '../repositories/user-repository.js';
import { DatabaseService } from '../services/database-service.js';

async function main() {
    const { values, positionals } = parseArgs({
        options: {
            query: {
                type: 'string',
                short: 'q',
            },
        },
        allowPositionals: true,
    });

    const query = values.query ?? positionals[0];

    if (!query) {
        console.error(
            `Usage: find-user <query> | --query <query> | -q <query>`
        );
        process.exit(-1);
    }

    Config.initialize();
    if (!Config.useDb) {
        console.error('No database is configured.');
        process.exit(-1);
    }

    let databaseService: DatabaseService;
    try {
        databaseService = await DatabaseService.createNewDatabaseConnection();
    } catch (e: unknown) {
        console.error('Error connecting to the database:');
        throw e;
    }
    console.error('Successfully connected to the database.');

    const userRepository = new UserRepository(
        databaseService.databaseConnection
    );

    console.log(await userRepository.findUser(query));

    await databaseService.destroy();
}

main();
