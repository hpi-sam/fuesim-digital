import type { CookieOptions } from 'express';

export interface HttpResponse<T extends object | undefined = undefined> {
    statusCode: number;
    body: HttpErrorMessage | T;
    cookies?: { name: string; value: string | null; options?: CookieOptions }[];
    redirect?: string | null;
}

export interface HttpErrorMessage {
    message: string;
}
