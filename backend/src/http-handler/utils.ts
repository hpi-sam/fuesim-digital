export interface HttpResponse<T extends object | undefined = undefined> {
    statusCode: number;
    body: HttpErrorMessage | T;
}

export interface HttpErrorMessage {
    message: string;
}
