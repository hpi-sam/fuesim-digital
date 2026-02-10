import type {
    HttpHandlerFn,
    HttpRequest,
    HttpEvent,
} from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
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

export function errorHandlingInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
    const messageService = inject(MessageService);
    return next(req).pipe(
        catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse) {
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
