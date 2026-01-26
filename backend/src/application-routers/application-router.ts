import { HttpRouter } from '../http-router.js';
import type { AuthService } from '../auth/auth-service.js';
import type { ExerciseService } from '../database/services/exercise-service.js';
import type { ExerciseManagerService } from '../database/services/exercise-manager-service.js';
import { ExerciseManagerHttpRouter } from './exercise-manager-router.js';
import { ExerciseHttpRouter } from './exercise-router.js';

export class ApplicationRouter extends HttpRouter {
    public constructor(
        private readonly authService: AuthService,
        private readonly exerciseService: ExerciseService,
        private readonly exerciseManagerService: ExerciseManagerService
    ) {
        super();
        this.router.use(
            new ExerciseHttpRouter(authService, exerciseService).router
        );
        this.router.use(
            new ExerciseManagerHttpRouter(
                authService,
                exerciseManagerService,
                exerciseService
            ).router
        );
    }
    protected override initializeRoutes() {
        /* empty */
    }
}
