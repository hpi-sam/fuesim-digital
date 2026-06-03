export interface Environment {
    production: boolean;
    /**
     * The port the backend HTTP server listens on
     */
    httpPort: number;
    /**
     * The port the backend websocket server listens on
     */
    websocketPort: number;
    /**
     * The URL at which the docs can be found
     */
    docsUrl: string;
}
