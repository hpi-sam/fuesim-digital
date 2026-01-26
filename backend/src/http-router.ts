import { Router } from 'express';

export abstract class HttpRouter {
    public readonly router: Router;

    public constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    protected abstract initializeRoutes(): void;
}
