import './utils/dotenv-config.js';
import dotenv from 'dotenv';
import { bool, cleanEnv, makeValidator, num, str, url } from 'envalid';

export class Config {
    private static _websocketPort?: number;

    private static _httpPort?: number;

    private static _httpBackendUrl?: string;

    private static _httpFrontendUrl?: string;

    private static _uploadLimit?: number;

    private static _useDb?: boolean;

    private static _dbUser?: string;

    private static _dbPassword?: string;

    private static _dbName?: string;

    private static _dbLogging?: boolean;

    private static _dbHost?: string;

    private static _dbPort?: number;

    private static _authUrl?: string;

    private static _authClientId?: string;

    private static _authClientSecret?: string;

    private static _authUserRegistrationAdapter?: string;

    private static _authSelfServiceUrl?: string;

    private static _devNoWaitingRoom?: boolean;

    private static _parallelExercisesEnabled?: boolean;

    public static get websocketPort(): number {
        this.throwIfNotInitialized();
        return this._websocketPort!;
    }

    public static get httpPort(): number {
        this.throwIfNotInitialized();
        return this._httpPort!;
    }

    public static get httpBackendUrl(): string {
        this.throwIfNotInitialized();
        return this._httpBackendUrl!;
    }

    public static get httpFrontendUrl(): string {
        this.throwIfNotInitialized();
        return this._httpFrontendUrl!;
    }

    public static get uploadLimit(): number {
        this.throwIfNotInitialized();
        return this._uploadLimit!;
    }

    public static get useDb(): boolean {
        this.throwIfNotInitialized();
        return this._useDb!;
    }

    public static get dbUser(): string {
        this.throwIfNotInitialized();
        return this._dbUser!;
    }

    public static get dbPassword(): string {
        this.throwIfNotInitialized();
        return this._dbPassword!;
    }

    public static get dbName(): string {
        this.throwIfNotInitialized();
        return this._dbName!;
    }

    public static get dbLogging(): boolean {
        this.throwIfNotInitialized();
        return this._dbLogging!;
    }

    public static get dbHost(): string {
        this.throwIfNotInitialized();
        return this._dbHost!;
    }

    public static get dbPort(): number {
        this.throwIfNotInitialized();
        return this._dbPort!;
    }

    public static get authUrl(): string {
        this.throwIfNotInitialized();
        return this._authUrl!;
    }

    public static get authClientId(): string {
        this.throwIfNotInitialized();
        return this._authClientId!;
    }

    public static get authClientSecret(): string {
        this.throwIfNotInitialized();
        return this._authClientSecret!;
    }

    public static get authUserRegistrationAdapter(): string {
        this.throwIfNotInitialized();
        return this._authUserRegistrationAdapter!;
    }

    public static get authSelfServiceUrl(): string {
        this.throwIfNotInitialized();
        return this._authSelfServiceUrl!;
    }

    public static get devNoWaitingRoom(): boolean {
        this.throwIfNotInitialized();
        return this._devNoWaitingRoom!;
    }

    public static get parallelExercisesEnabled(): boolean {
        this.throwIfNotInitialized();
        return this._parallelExercisesEnabled!;
    }

    private static createTCPPortValidator() {
        return makeValidator((x) => {
            const int = Number.parseInt(x);
            if (!Number.isInteger(int) || !(int >= 0 && int < 2 ** 16)) {
                throw new TypeError('Expected a valid port number');
            }
            return int;
        });
    }

    // This uses the condition that is also used by envalid (see https://github.com/af/envalid/blob/main/src/validators.ts#L39)
    private static isTrue(input: string | undefined): boolean {
        const lowercase = input?.toLowerCase();
        return lowercase === 'true' || lowercase === 't' || lowercase === '1';
    }

    private static parseVariables() {
        const tcpPortValidator = this.createTCPPortValidator();
        return cleanEnv(process.env, {
            DFM_WEBSOCKET_PORT: tcpPortValidator({ default: 3200 }),
            DFM_WEBSOCKET_PORT_TESTING: tcpPortValidator({ default: 13200 }),
            DFM_HTTP_PORT: tcpPortValidator({ default: 3201 }),
            DFM_HTTP_PORT_TESTING: tcpPortValidator({ default: 13201 }),
            DFM_HTTP_BACKEND_URL: url({ default: 'http://localhost:3201' }),
            DFM_HTTP_BACKEND_URL_TESTING: url({
                default: 'http://localhost:13201',
            }),
            DFM_HTTP_FRONTEND_URL: url({ default: 'http://localhost:4200' }),
            DFM_HTTP_FRONTEND_URL_TESTING: url({
                default: 'http://localhost:14200',
            }),
            DFM_UPLOAD_LIMIT: num({ default: 200 }),
            DFM_USE_DB: bool(),
            DFM_USE_DB_TESTING: bool({ default: undefined }),
            DFM_DB_USER: str(
                // Require this variable only when the database should be used.
                this.isTrue(process.env['DFM_USE_DB'])
                    ? {}
                    : { default: undefined }
            ),
            DFM_DB_USER_TESTING: str({ default: undefined }),
            DFM_DB_PASSWORD: str(
                // Require this variable only when the database should be used.
                this.isTrue(process.env['DFM_USE_DB'])
                    ? {}
                    : { default: undefined }
            ),
            DFM_DB_PASSWORD_TESTING: str({ default: undefined }),
            DFM_DB_NAME: str(
                // Require this variable only when the database should be used.
                this.isTrue(process.env['DFM_USE_DB'])
                    ? {}
                    : { default: undefined }
            ),
            DFM_DB_NAME_TESTING: str({ default: undefined }),
            DFM_DB_LOG: bool({ default: false }),
            DFM_DB_LOG_TESTING: bool({ default: undefined }),
            DFM_DB_HOST: str({ default: '127.0.0.1' }),
            DFM_DB_HOST_TESTING: str({ default: undefined }),
            DFM_DB_PORT: tcpPortValidator({ default: 5432 }),
            DFM_DB_PORT_TESTING: tcpPortValidator({ default: undefined }),
            DFM_AUTH_URL: url({ default: 'http://127.0.0.1:9091/' }),
            DFM_AUTH_URL_TESTING: url({ default: 'http://127.0.0.1:9091/' }),
            DFM_AUTH_CLIENT_ID: str({ default: 'dfm-backend' }),
            DFM_AUTH_CLIENT_ID_TESTING: str({ default: 'dfm-backend' }),
            DFM_AUTH_CLIENT_SECRET: str({ default: '' }),
            DFM_AUTH_CLIENT_SECRET_TESTING: str({ default: '' }),
            DFM_AUTH_USER_REGISTRATION_ADAPTER: str({
                default: '',
                choices: ['', 'keycloak'],
            }),
            DFM_AUTH_USER_REGISTRATION_ADAPTER_TESTING: str({
                default: '',
                choices: ['', 'keycloak'],
            }),
            DFM_AUTH_SELF_SERVICE_URL: url({ default: '' }),
            DFM_AUTH_SELF_SERVICE_URL_TESTING: url({ default: '' }),
            DFM_DEV_NO_WAITING_ROOM: bool({ default: false }),
            DFM_PARALLEL_EXERCISES_ENABLED: bool({ default: true }),
        });
    }

    private static isInitialized = false;

    private static throwIfNotInitialized() {
        if (!this.isInitialized)
            throw new Error('Config was used uninitialized');
    }

    public static initialize(
        testing: boolean = false,
        forceRefresh: boolean = false
    ) {
        if (this.isInitialized && !forceRefresh) {
            return;
        }
        dotenv.config();
        const env = this.parseVariables();
        this._websocketPort = testing
            ? env.DFM_WEBSOCKET_PORT_TESTING
            : env.DFM_WEBSOCKET_PORT;
        this._httpPort = testing
            ? env.DFM_HTTP_PORT_TESTING
            : env.DFM_HTTP_PORT;
        this._httpBackendUrl =
            testing && env.DFM_HTTP_BACKEND_URL_TESTING
                ? env.DFM_HTTP_BACKEND_URL_TESTING
                : env.DFM_HTTP_BACKEND_URL;
        this._httpFrontendUrl =
            testing && env.DFM_HTTP_FRONTEND_URL_TESTING
                ? env.DFM_HTTP_FRONTEND_URL_TESTING
                : env.DFM_HTTP_FRONTEND_URL;
        this._uploadLimit = env.DFM_UPLOAD_LIMIT;
        this._useDb =
            testing && env.DFM_USE_DB_TESTING
                ? env.DFM_USE_DB_TESTING
                : env.DFM_USE_DB;
        this._dbUser =
            testing && env.DFM_DB_USER_TESTING
                ? env.DFM_DB_USER_TESTING
                : env.DFM_DB_USER;
        this._dbPassword =
            testing && env.DFM_DB_PASSWORD_TESTING
                ? env.DFM_DB_PASSWORD_TESTING
                : env.DFM_DB_PASSWORD;
        this._dbName =
            testing && env.DFM_DB_NAME_TESTING
                ? env.DFM_DB_NAME_TESTING
                : env.DFM_DB_NAME;
        this._dbLogging =
            testing && env.DFM_DB_LOG_TESTING
                ? env.DFM_DB_LOG_TESTING
                : env.DFM_DB_LOG;
        this._dbHost =
            testing && env.DFM_DB_HOST_TESTING
                ? env.DFM_DB_HOST_TESTING
                : env.DFM_DB_HOST;
        this._dbPort =
            testing && env.DFM_DB_PORT_TESTING
                ? env.DFM_DB_PORT_TESTING
                : env.DFM_DB_PORT;
        this._authUrl =
            testing && env.DFM_AUTH_URL_TESTING
                ? env.DFM_AUTH_URL_TESTING
                : env.DFM_AUTH_URL;
        this._authClientId =
            testing && env.DFM_AUTH_CLIENT_ID_TESTING
                ? env.DFM_AUTH_CLIENT_ID_TESTING
                : env.DFM_AUTH_CLIENT_ID;
        this._authClientSecret =
            testing && env.DFM_AUTH_CLIENT_SECRET_TESTING
                ? env.DFM_AUTH_CLIENT_SECRET_TESTING
                : env.DFM_AUTH_CLIENT_SECRET;
        this._authUserRegistrationAdapter =
            testing && env.DFM_AUTH_USER_REGISTRATION_ADAPTER_TESTING
                ? env.DFM_AUTH_USER_REGISTRATION_ADAPTER_TESTING
                : env.DFM_AUTH_USER_REGISTRATION_ADAPTER;
        this._authSelfServiceUrl =
            testing && env.DFM_AUTH_SELF_SERVICE_URL_TESTING
                ? env.DFM_AUTH_SELF_SERVICE_URL_TESTING
                : env.DFM_AUTH_SELF_SERVICE_URL;
        this._devNoWaitingRoom = env.DFM_DEV_NO_WAITING_ROOM;
        this._parallelExercisesEnabled = testing
            ? true
            : env.DFM_PARALLEL_EXERCISES_ENABLED;
        this.isInitialized = true;
    }
}

export function isDevelopment() {
    return process.env['NODE_ENV'] !== 'production';
}
