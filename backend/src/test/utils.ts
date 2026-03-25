import type {
    ClientToServerEvents,
    MergeIntersection,
    ServerToClientEvents,
} from 'fuesim-digital-shared';
import {
    exerciseKeysSchema,
    getExerciseTemplateResponseDataSchema,
    sleep,
    socketIoTransports,
} from 'fuesim-digital-shared';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import request from 'supertest';
import {
    DatabaseService,
    testingDatabaseName,
} from '../database/services/database-service.js';
import { Config } from '../config.js';
import type { HttpMethod } from '../utils/http-handlers.js';
import { FuesimServer } from '../fuesim-server.js';
import { ExerciseService } from '../database/services/exercise-service.js';
import { ExerciseRepository } from '../database/repositories/exercise-repository.js';
import { ActionRepository } from '../database/repositories/action-repository.js';
import { AuthService } from '../auth/auth-service.js';
import { UserRepository } from '../database/repositories/user-repository.js';
import { SessionRepository } from '../database/repositories/session-repository.js';
import { ExerciseManagerService } from '../database/services/exercise-manager-service.js';
import type { OidcService } from '../auth/oidc-service.js';
import { AccessKeyService } from '../database/services/access-key-service.js';
import { AccessKeyRepository } from '../database/repositories/access-key-repository.js';
import type { Services } from '../database/services/index.js';
import { ParallelExerciseService } from '../database/services/parallel-exercise-service.js';
import { ParallelExerciseRepository } from '../database/repositories/parallel-exercise-repository.js';
import type { Repositories } from '../database/repositories/index.js';
import type { SocketReservedEvents } from './socket-reserved-events.js';

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

    public async waitOn<
        EventKey extends keyof AllServerToClientEvents,
        Callback extends
            AllServerToClientEvents[EventKey] = AllServerToClientEvents[EventKey],
        Response extends Parameters<Callback>[0] = Parameters<Callback>[0],
    >(event: EventKey): Promise<Response> {
        return new Promise<Response>((resolve) => {
            this.socket.on(event, resolve as any);
        });
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

export class TestEnvironment {
    public server!: FuesimServer;
    private _services!: Services;
    private _repositories!: Repositories;

    public get repositories(): Repositories {
        return this._repositories;
    }

    public get services(): Services {
        return this._services;
    }

    public httpRequest(
        method: HttpMethod,
        url: string,
        session?: string
    ): request.Test {
        const req = request(this.server.httpServer.httpServer)[method](url);
        if (session) {
            req.set(
                'Cookie',
                `${this.services.authService.SESSION_COOKIE_NAME}=${session}`
            );
        }

        return req;
    }

    public init(repositories: Repositories, services: Services) {
        this._repositories = repositories;
        this._services = services;
        this.server = new FuesimServer(this.services);
    }

    /**
     * Simplifies the process of simulating websocket requests and responses.
     * @param closure a function that gets a connected websocket client as its argument and should resolve after all operations are finished
     */
    public async withWebsocket(
        closure: (websocketClient: WebsocketClient) => Promise<any>,
        session?: string
    ): Promise<void> {
        let clientSocket: ExerciseClientSocket | undefined;
        try {
            clientSocket = io(`ws://127.0.0.1:${Config.websocketPort}`, {
                ...socketIoTransports,
                ...(session
                    ? {
                          extraHeaders: {
                              Cookie: `${this.services.authService.SESSION_COOKIE_NAME}=${session}`,
                          },
                      }
                    : {}),
            });
            const websocketClient = new WebsocketClient(clientSocket);
            await closure(websocketClient);
        } finally {
            clientSocket?.close();
        }
    }
}

export function createTestEnvironment(): TestEnvironment {
    Config.initialize(true);
    const environment = new TestEnvironment();
    let databaseService: DatabaseService;
    let exerciseService: ExerciseService;
    let authService: AuthService;
    let exerciseManagerService: ExerciseManagerService;
    let accessKeyService: AccessKeyService;
    let exerciseRepository: ExerciseRepository;
    let actionRepository: ActionRepository;
    let userRepository: UserRepository;
    let sessionRepository: SessionRepository;
    let accessKeyRepository: AccessKeyRepository;
    let parallelExerciseService: ParallelExerciseService;
    let parallelExerciseRepository: ParallelExerciseRepository;

    // If this gets too slow, we may look into creating the server only once
    beforeEach(async () => {
        databaseService = await setupDatabase();
        exerciseRepository = new ExerciseRepository(
            databaseService.databaseConnection
        );
        actionRepository = new ActionRepository(
            databaseService.databaseConnection
        );
        accessKeyRepository = new AccessKeyRepository(
            databaseService.databaseConnection
        );
        parallelExerciseRepository = new ParallelExerciseRepository(
            databaseService.databaseConnection
        );

        accessKeyService = new AccessKeyService(accessKeyRepository);
        exerciseService = new ExerciseService(
            exerciseRepository,
            actionRepository,
            accessKeyService
        );
        userRepository = new UserRepository(databaseService.databaseConnection);
        sessionRepository = new SessionRepository(
            databaseService.databaseConnection
        );

        authService = await new AuthService(
            userRepository,
            sessionRepository
        ).initialize({ skipOidcDiscovery: true });
        exerciseManagerService = new ExerciseManagerService(
            exerciseRepository,
            exerciseService
        );
        parallelExerciseService = new ParallelExerciseService(
            parallelExerciseRepository,
            accessKeyService,
            exerciseManagerService,
            exerciseService
        );

        const repositories: Repositories = {
            exerciseRepository,
            actionRepository,
            accessKeyRepository,
            parallelExerciseRepository,
            sessionRepository,
            userRepository,
        };
        const services: Services = {
            authService,
            exerciseManagerService,
            exerciseService,
            parallelExerciseService,
            accessKeyService,
            databaseService,
        };
        environment.init(repositories, services);
    });
    afterEach(async () => {
        // Prevent the dataSource from being closed too soon.
        await sleep(200);
        await environment.server.destroy();

        await databaseService.destroy();
    });

    return environment;
}

export const defaultTestUserSessionData: OidcService.UserInfo = {
    displayName: 'Test User',
    id: 'test-user',
    username: 'testuser',
};
export const alternativeTestUserSessionData: OidcService.UserInfo = {
    displayName: 'Test User 2',
    id: 'test-user-2',
    username: 'testuser2',
};
export async function createTestUserSession(
    environment: TestEnvironment,
    data?: { user?: OidcService.UserInfo; expired?: boolean }
) {
    const session = await environment.services.authService.createNewSession({
        user: data?.user ?? defaultTestUserSessionData,
        accessToken: 'abc',
        validityDurationMs: data?.expired ? 0 : undefined,
    });
    return session;
}

async function setupDatabase(): Promise<DatabaseService> {
    if (!Config.useDb) {
        return DatabaseService.createNewDatabaseConnection('testing');
    }

    const baselineDataSource =
        await DatabaseService.createNewDatabaseConnection('baseline');

    // Re-create the test database
    await baselineDataSource.databaseConnection.execute(
        `DROP DATABASE IF EXISTS "${testingDatabaseName}"`
    );
    await baselineDataSource.databaseConnection.execute(
        `CREATE DATABASE "${testingDatabaseName}"`
    );
    await baselineDataSource.destroy();

    // Ensure required Postgres extensions are available in the test DB
    // (e.g. uuid_generate_v4() comes from the "uuid-ossp" extension)
    const testDatabaseService =
        await DatabaseService.createNewDatabaseConnection('testing');
    await testDatabaseService.databaseConnection.execute(
        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    );

    // Apply the migrations on the newly created database
    await DatabaseService.migrate(testDatabaseService.databaseConnection);

    return testDatabaseService;
}

export async function createExercise(
    environment: TestEnvironment,
    session?: string
) {
    const response = await environment
        .httpRequest('post', '/api/exercise', session)
        .expect(201);

    return exerciseKeysSchema.parse(response.body);
}

export async function createExerciseTemplate(
    environment: TestEnvironment,
    session: string
) {
    const response = await environment
        .httpRequest('post', '/api/exercise_templates', session)
        .send({
            name: 'Test Template',
            description: 'Test Template Description',
        })
        .expect(201);

    return getExerciseTemplateResponseDataSchema.parse(response.body);
}
