import type {
    HttpHandlerFn,
    HttpRequest,
    HttpEvent,
} from '@angular/common/http';
import {
    HttpContext,
    HttpContextToken,
    HttpErrorResponse,
} from '@angular/common/http';
import type { Observable } from 'rxjs';
import { catchError } from 'rxjs';
import { inject } from '@angular/core';
import { MessageService } from '../../core/messages/message.service';

export function withCredentialsInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
    const clonedReq = req.clone({ withCredentials: true });
    return next(clonedReq);
}

/*
 * INFO: The error toast message can easily be
 * prevented for 4xx-5xx status codes
 * by adding the `preventNetworkErrorToastContext`
 * to the request context.
 */
export function errorHandlingInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
    const messageService = inject(MessageService);
    return next(req).pipe(
        catchError((error: unknown) => {
            if (
                error instanceof HttpErrorResponse &&
                !(
                    error.status !== 0 &&
                    req.context.get(PREVENT_NETWORK_ERROR_TOAST)
                )
            ) {
                let message = 'Die Netzwerkanfrage ist fehlgeschlagen.';
                if (error.error?.message) {
                    message = error.error.message;
                }
                messageService.postError({
                    title: 'Serverfehler',
                    body: message,
                    error,
                });
            }
            throw error;
        })
    );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const PREVENT_NETWORK_ERROR_TOAST = new HttpContextToken(() => false);

export function preventStatusErrorToastContext(
    httpContext: HttpContext = new HttpContext()
): HttpContext {
    return httpContext.set(PREVENT_NETWORK_ERROR_TOAST, true);
}
