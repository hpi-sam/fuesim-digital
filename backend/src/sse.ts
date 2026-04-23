import type {
    Request as ExpressRequest,
    Response as ExpressResponse,
} from 'express';
import { interval, Subject, takeUntil } from 'rxjs';

export class SSE {
    public readonly HEARTBEAT_INTERVAL = 1_000; // 1 seconds

    public constructor(
        private readonly req: ExpressRequest,
        private readonly res: ExpressResponse
    ) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        interval(this.HEARTBEAT_INTERVAL)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.sendEvent('heartbeat', { timestamp: Date.now() });
            });

        req.on('close', () => {
            this._destroy$.next();
            this._destroy$.complete();
        });
    }

    private readonly _destroy$ = new Subject<void>();
    public get destroy$() {
        return this._destroy$.asObservable();
    }

    public send(data: any) {
        this.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    public sendEvent(event: string, data: any) {
        this.res.write(`event: ${event}\n`);
        this.send(data);
    }

    public close() {
        this.res.end();
    }
}
