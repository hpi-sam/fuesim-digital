import { HttpRouter } from './http-router.js';
import { secureHttp } from './utils/secure-http.js';

export class HealthHttpRouter extends HttpRouter {
    protected initializeRoutes() {
        // This endpoint is used to determine whether the API itself is running.
        // It should be independent from any other services that may or may not be running.
        // This is used for the Cypress CI.
        this.router.get('/api/health', async (_req, res) =>
            secureHttp(
                () => ({
                    statusCode: 200,
                    body: {
                        status: 'API running',
                    },
                }),
                _req,
                res
            )
        );
    }
}
