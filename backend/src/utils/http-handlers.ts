import type {
    ErrorRequestHandler,
    RequestHandler,
    Request as HttpRequest,
} from 'express';
import { z, ZodError } from 'zod';
import type { AuthService } from '../auth/auth-service.js';
import { PermissionDeniedError, ApiError } from './http.js';

export type HttpMethod =
    | 'delete'
    | 'get'
    | 'head'
    | 'options'
    | 'patch'
    | 'post'
    | 'put';

export const createSessionMiddleware =
    (authService: AuthService): RequestHandler =>
    async (req, res, next) => {
        const sessionToken = req.cookies[authService.SESSION_COOKIE_NAME];
        if (sessionToken) {
            // eslint-disable-next-line require-atomic-updates
            req.session =
                await authService.getDataFromSessionToken(sessionToken);
        } else {
            req.session = undefined;
        }

        next();
    };

export const isAuthenticatedMiddleware: RequestHandler = (req, res, next) => {
    if (!req.session) {
        throw new PermissionDeniedError();
    }
    next();
};

export function warnError(req: HttpRequest, err: any) {
    console.warn(
        `An error occurred on http request ${req.path}: ${err}`,
        err instanceof Error && err.stack
            ? `at ${err.stack}`
            : 'no error or no stack'
    );
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    try {
        if (err instanceof ApiError) {
            res.status(err.statusCode).send({ message: err.message });
        } else if (err instanceof ZodError) {
            // Input validation failed
            res.status(400).send({ message: z.treeifyError(err) });
        } else {
            warnError(req, err);
            res.status(500).send({
                message: 'Es ist ein interner Serverfehler aufgetreten.',
            });
        }
    } catch (innerError: unknown) {
        // Nothing works. Log if in production mode, otherwise re-throw inner error
        if (process.env['NODE_ENV'] !== 'production') {
            throw innerError;
        }
        console.warn(
            `An error occurred while handling above http error and trying to respond to client: ${innerError}`
        );
    }
};
