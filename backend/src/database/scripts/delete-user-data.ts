import { parseArgs } from 'node:util';
import type { Interface } from 'node:readline/promises';
import { createInterface } from 'node:readline/promises';
import { TransactionRollbackError } from 'drizzle-orm';
import { Config } from '../../config.js';
import { AccessKeyRepository } from '../repositories/access-key-repository.js';
import { ActionRepository } from '../repositories/action-repository.js';
import { CollectionRepository } from '../repositories/collection-repository.js';
import { ExerciseRepository } from '../repositories/exercise-repository.js';
import type { Repositories } from '../repositories/index.js';
import { OrganisationRepository } from '../repositories/organisation-repository.js';
import { ParallelExerciseRepository } from '../repositories/parallel-exercise-repository.js';
import { SessionRepository } from '../repositories/session-repository.js';
import { UserRepository } from '../repositories/user-repository.js';
import { DatabaseService } from '../services/database-service.js';

async function promptContinue(rl: Interface, prompt: string): Promise<boolean> {
    const res = (await rl.question(`${prompt} (yes|no): `))
        .trim()
        .toLowerCase();

    return res === 'y' || res === 'yes';
}

async function main() {
    const { values, positionals } = parseArgs({
        options: {
            userId: {
                type: 'string',
                short: 'u',
            },
        },
        allowPositionals: true,
    });

    const userId = values.userId ?? positionals[0];

    if (!userId) {
        console.error(
            `Usage: delete-user-data <userId> | --userId <userId> | -u <userId>`
        );
        process.exit(-1);
    }

    const rl = createInterface({
        input: process.stdin,
        output: process.stderr,
    });

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

    await databaseService.databaseConnection.transaction(async (trx) => {
        function abort(): never {
            return trx.rollback();
        }

        const repositories: Repositories = {
            exerciseRepository: new ExerciseRepository(trx),
            actionRepository: new ActionRepository(trx),
            userRepository: new UserRepository(trx),
            sessionRepository: new SessionRepository(trx),
            accessKeyRepository: new AccessKeyRepository(trx),
            parallelExerciseRepository: new ParallelExerciseRepository(trx),
            organisationRepository: new OrganisationRepository(trx),
            collectionRepository: new CollectionRepository(trx),
        };

        const user = await repositories.userRepository.getUserById(userId);

        if (!user) {
            console.error(`No user found with id '${userId}'.`);
            abort();
        }

        if (
            !(await promptContinue(
                rl,
                `Found user '${user.displayName} (${user.username})'. Is this correct?`
            ))
        )
            abort();

        const organisations =
            await repositories.organisationRepository.getOrganisationsForUser(
                userId,
                ['admin', 'editor', 'viewer']
            );
        const adminCounts = await Promise.all(
            organisations.map(async (org) =>
                repositories.organisationRepository.getAdminCountWithout(
                    org.id,
                    userId
                )
            )
        );
        const staleOrganisations = organisations.filter(
            (_, index) => adminCounts[index] === 0
        );

        if (staleOrganisations.length > 0) {
            console.error(
                `Found organisations of which '${user.displayName}' is the only admin.`
            );
            for (const org of staleOrganisations) {
                console.error(`\t- ${org.name} (${org.id})`);
            }
            console.error(
                'If you continue, THESE AND ALL THEIR CONTENTS WILL BE DELETED!'
            );
            if (!(await promptContinue(rl, 'Continue?'))) abort();
        }

        const exercises = (
            await Promise.all(
                staleOrganisations.map(async (org) =>
                    repositories.exerciseRepository.getAllExercisesForOrganisation(
                        org.id
                    )
                )
            )
        ).flat();
        const exerciseTemplates = (
            await Promise.all(
                staleOrganisations.map(async (org) =>
                    repositories.exerciseRepository.getAllExerciseTemplatesForOrganisation(
                        org.id
                    )
                )
            )
        ).flat();
        const parallelExercises = (
            await Promise.all(
                staleOrganisations.map(async (org) =>
                    repositories.parallelExerciseRepository.getParallelExercisesForOrganisation(
                        org.id
                    )
                )
            )
        ).flat();
        const collections = (
            await Promise.all(
                staleOrganisations.map(async (org) =>
                    repositories.collectionRepository.getOrganisationCollections(
                        org.id
                    )
                )
            )
        ).flat();
        const sessions =
            await repositories.sessionRepository.getAllSessionsByUser(userId);

        console.error('This operation will delete:');
        console.error(`\tSessions: ${sessions.length}`);
        console.error(`\tOrganisations: ${staleOrganisations.length}`);
        console.error(`\tCollections: ${collections.length}`);
        console.error(`\tExercises: ${exercises.length}`);
        console.error(`\tExercise Templates: ${exerciseTemplates.length}`);
        console.error(`\tParallel Exercises: ${parallelExercises.length}`);

        if (!(await promptContinue(rl, 'Are you sure?'))) abort();

        await Promise.all([
            repositories.userRepository.deleteUserById(userId),
            ...sessions.map(async (ses) =>
                repositories.sessionRepository.deleteSessionById(ses.id)
            ),
            ...staleOrganisations.map((org) =>
                repositories.organisationRepository.deleteOrganisationById(
                    org.id
                )
            ),
            ...collections.map(async (col) =>
                repositories.collectionRepository.deleteCollection(
                    col.collectionId
                )
            ),
            ...exercises.map((ex) =>
                repositories.exerciseRepository.deleteExerciseById(ex.id)
            ),
            ...exerciseTemplates.map((ex) =>
                repositories.exerciseRepository.deleteExerciseTemplateById(
                    ex.id
                )
            ),
            ...parallelExercises.map((pe) =>
                repositories.parallelExerciseRepository.deleteParallelExerciseById(
                    pe.id
                )
            ),
        ]);
    });

    console.error('Success');

    rl.close();
    await databaseService.destroy();
}

main().catch((error: unknown) => {
    if (error instanceof TransactionRollbackError) {
        console.error('Aborted. No changes were made.');
    } else {
        console.error(error);
    }
    process.exit(1);
});
