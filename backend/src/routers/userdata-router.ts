import { Router } from 'express';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import type { UserDataService } from '../database/services/userdata-service.js';

export function createUserdataRouter(userDataService: UserDataService): Router {
    const router = Router();

    router.get('/dump', isAuthenticatedMiddleware, async (req, res) => {
        const userId = req.session!.user.id;
        res.status(200).json(await userDataService.getUserDataDump(userId));
    });

    return router;
}
