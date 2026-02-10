export class ApiError extends Error {
    public statusCode = 400;
}
export class NotFoundError extends ApiError {
    public override statusCode = 404;
    public constructor() {
        super(`Das Objekt existiert nicht.`);
    }
}
export class PermissionDeniedError extends ApiError {
    public override statusCode = 403;
    public constructor() {
        super('Sie haben keine Berechtigung für diese Operation.');
    }
}
