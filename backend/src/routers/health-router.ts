import { Router } from 'express';

export const healthRouter = Router();
// This endpoint is used to determine whether the API itself is running.
// It should be independent of any other services that may or may not be running.
// This is used for the Cypress CI.
healthRouter.get('/health', async (_req, res) => {
    res.send({
        status: 'API running',
    });
});
