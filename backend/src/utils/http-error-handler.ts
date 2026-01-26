import type { ErrorRequestHandler } from 'express';
import { ApiError } from 'digital-fuesim-manv-shared';

export type HttpMethod =
    | 'delete'
    | 'get'
    | 'head'
    | 'options'
    | 'patch'
    | 'post'
    | 'put';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    try {
        if (err instanceof ApiError) {
            res.status(err.statusCode).send({ message: err.message });
        } else {
            const message = `An error occurred on http request ${req.path}: ${err}`;
            console.warn(
                message,
                err instanceof Error && err.stack
                    ? `at ${err.stack}`
                    : 'no error or no stack'
            );
            res.status(500).send({ message });
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
