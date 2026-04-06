import { drizzle as postgresDrizzle } from 'drizzle-orm/node-postgres';
import { PgliteDatabase, drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { migrate as migratePgLite } from 'drizzle-orm/pglite/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { getTableColumns, sql } from 'drizzle-orm';
import { Config } from '../../config.js';
import { relations } from '../schema.js';

export type DatabaseConnectionMode = 'baseline' | 'default' | 'testing';

export let testingDatabaseName: string;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pgLiteConnection = pgliteDrizzle({
    relations,
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const postgresConnection = postgresDrizzle({
    connection: {},
    relations,
});
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

    private static async createPostgresConnection(
        mode: DatabaseConnectionMode
    ): Promise<DatabaseConnection> {
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
            relations,
        });
        await this.testConnection(connection);
        return connection;
    }

    private static async createPgliteConnection(): Promise<DatabaseConnection> {
        const connection = pgliteDrizzle({
            client: new PGlite({
                extensions: { uuid_ossp },
            }),
            relations,
            logger: Config.dbLogging,
        });
        await this.testConnection(connection);
        await connection.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await this.migrate(connection);
        return connection;
    }

    public static async createNewDatabaseConnection(
        mode: DatabaseConnectionMode = 'default'
    ) {
        Config.initialize();
        let connection: DatabaseConnection;

        if (Config.useDb) {
            connection = await this.createPostgresConnection(mode);
        } else {
            connection = await this.createPgliteConnection();
        }

        return new DatabaseService(connection);
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

    public static upsertHelper(table: DatabaseTable) {
        return Object.fromEntries(
            Object.entries(getTableColumns(table)).map(([key, value]) => [
                key,
                sql.raw(`EXCLUDED."${value.name}"`),
            ])
        );
    }
}

export type DatabaseConnection = Awaited<
    typeof pgLiteConnection | typeof postgresConnection
>;
export type DatabaseTable = AnyPgTable;
export type DatabaseTransaction = Parameters<
    Parameters<DatabaseConnection['transaction']>[0]
>[0];
