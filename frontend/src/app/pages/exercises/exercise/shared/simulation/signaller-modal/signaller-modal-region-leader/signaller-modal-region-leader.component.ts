import type { OnChanges, OnDestroy } from '@angular/core';
import { Component, inject, input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Personnel, UUID } from 'fuesim-digital-shared';
import {
    combineLatest,
    map,
    takeUntil,
    type Observable,
    Subject,
    distinctUntilChanged,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../state/app.state';
import {
    createSelectBehaviorStatesByType,
    selectPersonnel,
} from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-region-leader',
    templateUrl: './signaller-modal-region-leader.component.html',
    styleUrls: ['./signaller-modal-region-leader.component.scss'],
    imports: [AsyncPipe],
})
export class SignallerModalRegionLeaderComponent
    implements OnChanges, OnDestroy
{
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegionId = input.required<UUID>();
    readonly hasLeader = output<boolean>();

    leader$!: Observable<Personnel | null>;
    private readonly changeOrDestroy$ = new Subject<void>();

    ngOnChanges() {
        this.changeOrDestroy$.next();

        const assignLeaderBehaviorState$ = this.store
            .select(
                createSelectBehaviorStatesByType(
                    this.simulatedRegionId(),
                    'assignLeaderBehavior'
                )
            )
            .pipe(map((behaviorStates) => behaviorStates[0] ?? null));

        const personnel$ = this.store.select(selectPersonnel);

        this.leader$ = combineLatest([
            assignLeaderBehaviorState$,
            personnel$,
        ]).pipe(
            map(([behaviorState, personnel]) => {
                if (behaviorState?.leaderId) {
                    return personnel[behaviorState.leaderId] ?? null;
                }
                return null;
            })
        );

        this.leader$
            .pipe(
                map((personnel) => !!personnel),
                distinctUntilChanged(),
                takeUntil(this.changeOrDestroy$)
            )
            .subscribe((personnel) => this.hasLeader.emit(!!personnel));
    }

    ngOnDestroy() {
        this.changeOrDestroy$.next();
    }
}
