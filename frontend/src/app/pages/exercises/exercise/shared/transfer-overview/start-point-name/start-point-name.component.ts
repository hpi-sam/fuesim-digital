import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store, createSelector } from '@ngrx/store';
import type { StartPoint } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectAlarmGroup } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-start-point-name',
    templateUrl: './start-point-name.component.html',
    styleUrls: ['./start-point-name.component.scss'],
    standalone: false,
})
export class StartPointNameComponent implements OnChanges {
    @Input() startPoint!: StartPoint;

    alarmGroupName$: Observable<string> | undefined;

    constructor(private readonly store: Store<AppState>) {}

    ngOnChanges(): void {
        if (this.startPoint.type === 'alarmGroupStartPoint') {
            const alarmGroupNameSelector = createSelector(
                createSelectAlarmGroup(this.startPoint.alarmGroupId),
                (alarmGroup) => alarmGroup.name
            );
            this.alarmGroupName$ = this.store.select(alarmGroupNameSelector);
        }
    }
}
