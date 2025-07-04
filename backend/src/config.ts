import './utils/dotenv-config.js';
import dotenv from 'dotenv';
import { bool, cleanEnv, makeValidator, num, str } from 'envalid';

export class Config {
    private static _websocketPort?: number;

    private static _httpPort?: number;

    private static _uploadLimit?: number;

    private static _useDb?: boolean;

    private static _dbUser?: string;

    private static _dbPassword?: string;

    private static _dbName?: string;

    private static _dbLogging?: boolean;

    private static _dbHost?: string;

    private static _dbPort?: number;

    public static get websocketPort(): number {
        this.throwIfNotInitialized();
        return this._websocketPort!;
    }

    public static get httpPort(): number {
        this.throwIfNotInitialized();
        return this._httpPort!;
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
        this.isInitialized = true;
    }
}
