export class DatabaseError extends Error {
    public constructor(
        message: string,
        private readonly innerError?: Error
    ) {
        super(message);
    }
}
