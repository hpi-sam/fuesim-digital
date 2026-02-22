import { Request, Response } from 'express';
import { interval, Subject, takeUntil } from 'rxjs';

export class SSE {
    public HEARTBEAT_INTERVAL = 1_000; // 1 seconds

    constructor(
        private req: Request,
        private res: Response
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

    private _destroy$ = new Subject<void>();
    public get destroy$() {
        return this._destroy$.asObservable();
    }

    send(data: any) {
        this.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    sendEvent(event: string, data: any) {
        this.res.write(`event: ${event}\n`);
        this.send(data);
    }

    close() {
        this.res.end();
    }
}
