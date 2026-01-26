import { HttpRouter } from './http-router.js';

export class HealthHttpRouter extends HttpRouter {
    protected initializeRoutes() {
        // This endpoint is used to determine whether the API itself is running.
        // It should be independent of any other services that may or may not be running.
        // This is used for the Cypress CI.
        this.router.get('/api/health', async (_req, res) => {
            res.send({
                status: 'API running',
            });
        });
    }
}
