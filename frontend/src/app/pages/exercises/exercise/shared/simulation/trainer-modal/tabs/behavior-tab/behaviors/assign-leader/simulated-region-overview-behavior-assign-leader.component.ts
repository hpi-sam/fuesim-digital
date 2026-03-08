import type { OnChanges } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Personnel } from 'fuesim-digital-shared';
import { AssignLeaderBehaviorState } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../../../../../../../../state/app.state';
import { createSelectPersonnel } from '../../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-overview-behavior-assign-leader',
    templateUrl:
        './simulated-region-overview-behavior-assign-leader.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-assign-leader.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorAssignLeaderComponent
    implements OnChanges
{
    private readonly store = inject<Store<AppState>>(Store);

    @Input()
    assignLeaderBehaviorState!: AssignLeaderBehaviorState;

    currentLeader?: Observable<Personnel>;

    ngOnChanges(): void {
        if (this.assignLeaderBehaviorState.leaderId) {
            this.currentLeader = this.store.select(
                createSelectPersonnel(this.assignLeaderBehaviorState.leaderId)
            );
        }
    }
}
