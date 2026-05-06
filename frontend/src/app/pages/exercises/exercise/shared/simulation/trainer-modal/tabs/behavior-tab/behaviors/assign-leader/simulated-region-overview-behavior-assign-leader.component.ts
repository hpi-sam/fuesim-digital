import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Personnel } from 'fuesim-digital-shared';
import { AssignLeaderBehaviorState } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../../state/app.state';
import { createSelectPersonnel } from '../../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-overview-behavior-assign-leader',
    templateUrl:
        './simulated-region-overview-behavior-assign-leader.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-assign-leader.component.scss',
    ],
    imports: [AsyncPipe],
})
export class SimulatedRegionOverviewBehaviorAssignLeaderComponent
    implements OnChanges
{
    private readonly store = inject<Store<AppState>>(Store);

    readonly assignLeaderBehaviorState =
        input.required<AssignLeaderBehaviorState>();

    currentLeader?: Observable<Personnel>;

    ngOnChanges(): void {
        const assignLeaderBehaviorState = this.assignLeaderBehaviorState();
        if (assignLeaderBehaviorState.leaderId) {
            this.currentLeader = this.store.select(
                createSelectPersonnel(assignLeaderBehaviorState.leaderId)
            );
        }
    }
}
