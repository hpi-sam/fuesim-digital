import { Router } from 'express';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import type { UserDataService } from '../database/services/userdata-service.js';

export function createUserdataRouter(userDataService: UserDataService): Router {
    const router = Router();

    router.get('/dump', isAuthenticatedMiddleware, async (req, res) => {
        const userId = req.session!.user.id;

        const archive = await userDataService.getUserDataDumpArchive(userId);

        res.attachment(archive.filename);
        archive.archive.pipe(res);
    });

    return router;
}
