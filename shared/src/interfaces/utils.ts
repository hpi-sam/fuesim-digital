import type { Immutable } from 'immer';
import { z } from 'zod';

export class Route<TRequest = never, TResponse = never> {
    constructor(opts: { request?: TRequest; response?: TResponse }) {
        this.requestSchema = opts.request as TRequest;
        this.responseSchema = opts.response as TResponse;
    }

    public readonly requestSchema: TRequest;
    public readonly responseSchema: TResponse;
    public readonly Request!: TRequest extends z.ZodType
        ? Immutable<z.infer<TRequest>>
        : never;
    public readonly Response!: TResponse extends z.ZodType
        ? Immutable<z.infer<TResponse>>
        : never;
}

export const stringToDate = z.codec(
    z.iso.datetime({ offset: true }), // input schema: ISO date string
    z.date(), // output schema: Date object
    {
        decode: (isoString) => new Date(isoString), // ISO string → Date
        encode: (date) => date.toISOString(), // Date → ISO string
    }
);
