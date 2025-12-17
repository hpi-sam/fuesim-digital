import type {
    Response as ExpressResponse,
    Request as ExpressRequest,
} from 'express';
import type { HttpResponse } from './utils.js';

export type HttpMethod =
    | 'delete'
    | 'get'
    | 'head'
    | 'options'
    | 'patch'
    | 'post'
    | 'put';

export async function secureHttp<Result extends object | undefined>(
    operation: () => HttpResponse<Result> | Promise<HttpResponse<Result>>,
    req: ExpressRequest,
    res: ExpressResponse
): Promise<void> {
    try {
        const response = await operation();
        res.statusCode = response.statusCode;
        if (response.cookies) {
            for (const cookie of response.cookies) {
                if (cookie.value === null) {
                    res.clearCookie(cookie.name, cookie.options ?? {});
                } else {
                    res.cookie(cookie.name, cookie.value, cookie.options ?? {});
                }
            }
        }
        if (response.redirect) {
            res.redirect(response.redirect);
            return;
        }
        res.send(response.body);
    } catch (error: unknown) {
        // Try sending 500 response
        try {
            const message = `An error occurred on http request ${req.path}: ${error}`;
            console.warn(
                message,
                error instanceof Error && error.stack
                    ? `at ${error.stack}`
                    : 'no error or no stack'
            );
            res.statusCode = 500;
            res.send({
                statusCode: 500,
                body: { message },
            });
        } catch (innerError: unknown) {
            // Nothing works. Log if in production mode, otherwise re-throw inner error
            if (process.env['NODE_ENV'] !== 'production') {
                throw innerError;
            }
            console.warn(
                `An error occurred while handling above http error and trying to respond to client: ${innerError}`
            );
        }
    }
}
