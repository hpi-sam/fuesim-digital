import { Injectable } from '@angular/core';
import type { MapCoordinates, DrawingType } from 'fuesim-digital-shared';
import { Observable, Subject } from 'rxjs';

export interface DrawRequest {
    drawingType: DrawingType;
    strokeColor: string;
    fillColor?: string;
    endEvent: Observable<boolean | null>;
}

export interface DrawingResult {
    points: MapCoordinates[];
}

@Injectable({
    providedIn: 'root',
})
export class DrawingInteractionService {
    private readonly drawRequest = new Subject<DrawRequest>();
    private pendingResolve: ((result: DrawingResult | null) => void) | null =
        null;

    public get onDrawRequest$(): Observable<DrawRequest> {
        return this.drawRequest.asObservable();
    }

    public async requestDrawing(
        request: DrawRequest
    ): Promise<DrawingResult | null> {
        return new Promise<DrawingResult | null>((resolve) => {
            if (this.pendingResolve !== null) this.pendingResolve(null);
            this.pendingResolve = resolve;
            this.drawRequest.next(request);
        });
    }

    public completeDrawing(result: DrawingResult | null): void {
        if (this.pendingResolve) {
            this.pendingResolve(result);
            this.pendingResolve = null;
        }
    }
}
