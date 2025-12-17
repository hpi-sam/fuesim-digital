import { Router } from 'express';

export abstract class HttpRouter {
    public readonly router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    protected abstract initializeRoutes(): void;
}
