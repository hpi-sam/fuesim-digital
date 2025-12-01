import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Personnel } from 'digital-fuesim-manv-shared';
import { AssignLeaderBehaviorState } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectPersonnel } from 'src/app/state/application/selectors/exercise.selectors';

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
    @Input()
    assignLeaderBehaviorState!: AssignLeaderBehaviorState;

    currentLeader?: Observable<Personnel>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnChanges(): void {
        if (this.assignLeaderBehaviorState.leaderId) {
            this.currentLeader = this.store.select(
                createSelectPersonnel(this.assignLeaderBehaviorState.leaderId)
            );
        }
    }
}
