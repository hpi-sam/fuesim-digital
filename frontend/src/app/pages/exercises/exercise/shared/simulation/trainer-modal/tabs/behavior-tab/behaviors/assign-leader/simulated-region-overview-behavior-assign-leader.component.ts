import type { OnChanges } from '@angular/core';
import {
    Component,
    inject,
    input,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { Personnel } from 'fuesim-digital-shared';
import { AssignLeaderBehaviorState } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../../state/app.state';
import { createSelectPersonnel } from '../../../../../../../../../../state/application/selectors/exercise.selectors';
import { HelpButtonComponent } from '../../../../../../../../../../help-button/help-button.component';

@Component({
    selector: 'app-simulated-region-overview-behavior-assign-leader',
    templateUrl:
        './simulated-region-overview-behavior-assign-leader.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-assign-leader.component.scss',
    ],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AsyncPipe, HelpButtonComponent],
})
export class SimulatedRegionOverviewBehaviorAssignLeaderComponent implements OnChanges {
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
