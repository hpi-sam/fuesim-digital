import { drizzle as postgresDrizzle } from 'drizzle-orm/node-postgres';
import { PgliteDatabase, drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { migrate as migratePgLite } from 'drizzle-orm/pglite/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import * as schema from '../schema.js';
import { Config } from '../../config.js';

export type DatabaseConnectionMode = 'baseline' | 'default' | 'testing';

export let testingDatabaseName: string;

export class DatabaseService {
    public readonly databaseConnection: DatabaseConnection;
    private _initialized = false;

    public constructor(dbConnection: DatabaseConnection) {
        this.databaseConnection = dbConnection;
        this._initialized = true;
    }

    public get isInitialized() {
        return this._initialized;
    }

    public static async createNewDatabaseConnection(
        mode: DatabaseConnectionMode = 'default'
    ): Promise<DatabaseService> {
        Config.initialize();
        if (Config.useDb) {
            const defaultDatabaseName = `${Config.dbName}`;
            testingDatabaseName = `${Config.dbName}_TESTING`;
            const connection = postgresDrizzle({
                connection: {
                    host: Config.dbHost,
                    port: Config.dbPort,
                    database:
                        mode === 'baseline'
                            ? // This database probably always exists
                              'postgres'
                            : mode === 'default'
                              ? defaultDatabaseName
                              : testingDatabaseName,
                    user: Config.dbUser,
                    password: Config.dbPassword,
                    ssl: false,
                },
                logger: Config.dbLogging,
                schema,
            });
            await this.testConnection(connection);
            return new DatabaseService(connection);
        }

        const pgLite = new PGlite({
            extensions: { uuid_ossp },
        });
        const db = pgliteDrizzle({
            client: pgLite,
            schema,
            logger: Config.dbLogging,
        });
        await this.testConnection(db);
        await db.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await this.migrate(db);
        return new DatabaseService(db);
    }

    public static async testConnection(connection: DatabaseConnection) {
        await connection.execute('SELECT 1');
    }

    public static isInMemoryConnection(db: DatabaseConnection) {
        return db instanceof PgliteDatabase;
    }

    public static async migrate(db: DatabaseConnection) {
        const migrationsFolder = './drizzle/';
        if (this.isInMemoryConnection(db)) {
            await migratePgLite(db, { migrationsFolder });
        } else {
            await migratePostgres(db, { migrationsFolder });
        }
    }

    public async destroy() {
        const client = this.databaseConnection.$client;
        if (client instanceof Pool) {
            await client.end();
        } else {
            await client.close();
        }
        this._initialized = false;
    }
}

export type DatabaseConnection = Awaited<
    ReturnType<typeof pgliteDrizzle | typeof postgresDrizzle>
>;
export type DatabaseTable = AnyPgTable;
export type DatabaseTransaction = Parameters<
    Parameters<DatabaseConnection['transaction']>[0]
>[0];
