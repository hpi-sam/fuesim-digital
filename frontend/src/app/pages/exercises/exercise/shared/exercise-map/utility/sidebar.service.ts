import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Patient, Vehicle } from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../state/app.state';
import { selectExerciseKey } from '../../../../../../state/application/selectors/application.selectors';

export type SidebarElement = Patient | Vehicle;

@Injectable({
    providedIn: 'root',
})
export class SidebarService {
    private readonly router = inject(Router);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseKey = this.store.selectSignal(selectExerciseKey);

    public showInSidebar(element: SidebarElement) {
        this.router.navigateByUrl(this.getSidebarUrl(element));
    }

    public getSidebarUrl(element: SidebarElement) {
        // TODO: This will break in time-travel
        return `/exercises/${this.exerciseKey()}/map/${element.type}/x`;
    }

    public canGoBack() {
        // TODO: Implement history check
        return false;
    }
}
