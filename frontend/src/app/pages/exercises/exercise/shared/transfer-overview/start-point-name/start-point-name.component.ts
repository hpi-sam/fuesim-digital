import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store, createSelector } from '@ngrx/store';
import type { StartPoint } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../../../../state/app.state';
import { createSelectAlarmGroup } from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-start-point-name',
    templateUrl: './start-point-name.component.html',
    styleUrls: ['./start-point-name.component.scss'],
    standalone: false,
})
export class StartPointNameComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly startPoint = input.required<StartPoint>();

    alarmGroupName$: Observable<string> | undefined;

    ngOnChanges(): void {
        const startPoint = this.startPoint();
        if (startPoint.type === 'alarmGroupStartPoint') {
            const alarmGroupNameSelector = createSelector(
                createSelectAlarmGroup(startPoint.alarmGroupId),
                (alarmGroup) => alarmGroup.name
            );
            this.alarmGroupName$ = this.store.select(alarmGroupNameSelector);
        }
    }
}
