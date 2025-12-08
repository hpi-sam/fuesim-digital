import type {
    ClientToServerEvents,
    ExerciseIds,
    MergeIntersection,
    ServerToClientEvents,
} from 'digital-fuesim-manv-shared';
import { sleep, socketIoTransports } from 'digital-fuesim-manv-shared';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { DatabaseService } from '../src/database/services/database-service.js';
import {
    createNewDataSource,
    testingDatabaseName,
} from '../src/database/data-source.js';
import { Config } from '../src/config.js';
import type { HttpMethod } from '../src/exercise/http-handler/secure-http.js';
import { FuesimServer } from '../src/fuesim-server.js';
import type { SocketReservedEvents } from './socket-reserved-events.js';

export interface ExerciseCreationResponse {
    readonly participantId: string;
    readonly trainerId: string;
}

// Some helper types
/**
 * Returns the last element in an array
 */
type LastElement<T extends any[]> = T extends [...any[], infer R]
    ? R
    : T extends []
      ? undefined
      : never;

/**
 * Returns an array of all but the last element in an array
 * ```ts
 * HeadElements<[1]> // []
 * HeadElements<[1, string, 3]> // [1, string]
 * ```
 */
type HeadElements<T extends any[]> = T extends [...infer U, any] ? U : never;

type AllServerToClientEvents = MergeIntersection<
    ServerToClientEvents & SocketReservedEvents
>;

type ExerciseClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class WebsocketClient {
    public constructor(private readonly socket: ExerciseClientSocket) {}

    public async emit<
        EventKey extends keyof ClientToServerEvents,
        Event extends
            ClientToServerEvents[EventKey] = ClientToServerEvents[EventKey],
        EventParameters extends Parameters<Event> = Parameters<Event>,
        // We expect the callback to be the last parameter
        EventCallback extends
            LastElement<EventParameters> = LastElement<EventParameters>,
        Response extends
            Parameters<EventCallback>[0] = Parameters<EventCallback>[0],
    >(
        event: EventKey,
        ...args: HeadElements<Parameters<Event>>
    ): Promise<Response> {
        return new Promise<Response>((resolve) => {
            this.socket.emit(event as any, ...args, resolve);
        });
    }

    /**
     * Send arbitrary data to the server.
     * @param event The event name to use
     * @param args Any arguments to send
     */
    public insecureEmit(event: string, ...args: any[]) {
        this.socket.emit(event as any, ...args);
    }

    public on<
        EventKey extends keyof AllServerToClientEvents,
        Callback extends
            AllServerToClientEvents[EventKey] = AllServerToClientEvents[EventKey],
    >(event: EventKey, callback: Callback): void {
        this.socket.on(event, callback as any);
    }

    private readonly calls: Map<
        string,
        Parameters<AllServerToClientEvents[keyof AllServerToClientEvents]>[]
    > = new Map();

    public spyOn(event: keyof AllServerToClientEvents): void {
        this.on(event, (action: any) => {
            if (!this.calls.has(event)) {
                this.calls.set(event, []);
            }
            this.calls.get(event)!.push(action);
        });
    }

    public getTimesCalled(event: keyof AllServerToClientEvents): number {
        return this.getCalls(event).length;
    }

    public getCalls<EventKey extends keyof AllServerToClientEvents>(
        event: EventKey
    ): Parameters<AllServerToClientEvents[EventKey]>[] {
        return this.calls.get(event) ?? ([] as any[]);
    }
}

class TestEnvironment {
    public server!: FuesimServer;
    private _databaseService!: DatabaseService;
    public get databaseService(): DatabaseService {
        return this._databaseService;
    }

    public httpRequest(method: HttpMethod, url: string): request.Test {
        return request(this.server.httpServer.httpServer)[method](url);
    }

    /**
     * Simplifies the process of simulating websocket requests and responses.
     * @param closure a function that gets a connected websocket client as its argument and should resolve after all operations are finished
     */
    public async withWebsocket(
        closure: (websocketClient: WebsocketClient) => Promise<any>
    ): Promise<void> {
        let clientSocket: ExerciseClientSocket | undefined;
        try {
            clientSocket = io(`ws://127.0.0.1:${Config.websocketPort}`, {
                ...socketIoTransports,
            });
            const websocketClient = new WebsocketClient(clientSocket);
            await closure(websocketClient);
        } finally {
            clientSocket?.close();
        }
    }

    public init(databaseService: DatabaseService) {
        this._databaseService = databaseService;
        this.server = new FuesimServer(this.databaseService);
    }
}

export const createTestEnvironment = (): TestEnvironment => {
    Config.initialize(true);
    const environment = new TestEnvironment();
    let dataSource: DataSource;

    // If this gets too slow, we may look into creating the server only once
    beforeEach(async () => {
        dataSource = await setupDatabase();
        const databaseService = new DatabaseService(dataSource);
        environment.init(databaseService);
    });
    afterEach(async () => {
        // Prevent the dataSource from being closed too soon.
        await sleep(200);
        await environment.server.destroy();
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    });

    return environment;
};

async function setupDatabase() {
    if (!Config.useDb) {
        return createNewDataSource('testing');
    }
    const baselineDataSource =
        await createNewDataSource('baseline').initialize();
    // Re-create the test database
    await baselineDataSource.query(
        `DROP DATABASE IF EXISTS "${testingDatabaseName}"`
    );
    await baselineDataSource.query(`CREATE DATABASE "${testingDatabaseName}"`);
    await baselineDataSource.destroy();

    const testDataSource = createNewDataSource('testing');
    await testDataSource.initialize();

    // Apply the migrations on the newly created database
    await testDataSource.runMigrations({ transaction: 'all' });

    return testDataSource;
}

export async function createExercise(
    environment: TestEnvironment
): Promise<ExerciseIds> {
    const response = await environment
        .httpRequest('post', '/api/exercise')
        .expect(201);

    return response.body as ExerciseCreationResponse;
}
