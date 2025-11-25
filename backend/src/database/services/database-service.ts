import { drizzle as postgresDrizzle } from 'drizzle-orm/node-postgres';
import { drizzle as pgliteDrizzle } from 'drizzle-orm/pglite';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import { Config } from '../../config.js';
import * as schema from '../schema.js';

export class DatabaseService {
    public readonly databaseConnection: DatabaseConnection;

    public constructor(dbConnection?: DatabaseConnection) {
        this.databaseConnection =
            dbConnection ?? DatabaseService.createNewDatabaseConnection();
    }

    public get select() {
        return this.databaseConnection.select;
    }
    public get insert() {
        return this.databaseConnection.insert;
    }
    public get update() {
        return this.databaseConnection.update;
    }
    public get delete() {
        return this.databaseConnection.delete;
    }
    public get transaction() {
        return this.databaseConnection.transaction.bind(
            this.databaseConnection
        );
    }

    public get isInitialized() {
        // TODO: @Quixelation this is a temp fix
        return true;
    }

    public static createNewDatabaseConnection() {
        Config.initialize();
        if (Config.useDb) {
            return postgresDrizzle({
                connection: {
                    host: Config.dbHost,
                    port: Config.dbPort,
                    database: Config.dbName,
                    user: Config.dbUser,
                    password: Config.dbPassword,
                    ssl: false,
                },
                schema,
            });
        }
        return pgliteDrizzle({ schema });
    }
}

export type DatabaseConnection = ReturnType<
    typeof DatabaseService.createNewDatabaseConnection
>;
export type DatabaseTable = AnyPgTable;
export type DatabaseTransaction = Parameters<
    Parameters<DatabaseConnection['transaction']>[0]
>[0];
