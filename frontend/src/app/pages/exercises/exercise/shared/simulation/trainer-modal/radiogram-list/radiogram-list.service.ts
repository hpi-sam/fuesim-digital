import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class RadiogramListService {
    public readonly showDone$ = new BehaviorSubject<boolean>(false);
    public readonly showOtherClients$ = new BehaviorSubject<boolean>(false);

    setShowDone(value: boolean) {
        this.showDone$.next(value);
    }

    setShowOtherClients(value: boolean) {
        this.showOtherClients$.next(value);
    }
}
