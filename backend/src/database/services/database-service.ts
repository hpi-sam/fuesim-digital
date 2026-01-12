import { drizzle as postgresDrizzle } from 'drizzle-orm/node-postgres';
import { PgliteDatabase, drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { migrate as migratePgLite } from 'drizzle-orm/pglite/migrator';
import { migrate as migratePostgres } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { getTableColumns, sql } from 'drizzle-orm';
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

    private static async createPostgresConnection(
        mode: DatabaseConnectionMode
    ): Promise<ReturnType<typeof postgresDrizzle>> {
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
        return connection;
    }

    private static async createPgliteConnection(): Promise<
        ReturnType<typeof pgliteDrizzle>
    > {
        const connection = pgliteDrizzle({
            client: new PGlite({
                extensions: { uuid_ossp },
            }),
            schema,
            logger: Config.dbLogging,
        });
        await this.testConnection(connection);
        await connection.execute(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await this.migrate(connection);
        return connection;
    }

    public static async createNewDatabaseConnection(
        mode: DatabaseConnectionMode = 'default'
    ): Promise<DatabaseService> {
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
    ReturnType<typeof pgliteDrizzle | typeof postgresDrizzle>
>;
export type DatabaseTable = AnyPgTable;
export type DatabaseTransaction = Parameters<
    Parameters<DatabaseConnection['transaction']>[0]
>[0];
