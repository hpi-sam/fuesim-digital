import type {
    HttpHandlerFn,
    HttpRequest,
    HttpEvent,
} from '@angular/common/http';
import type { Observable } from 'rxjs';

export function withCredentialsInterceptor(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
    const clonedReq = req.clone({ withCredentials: true });
    return next(clonedReq);
}
