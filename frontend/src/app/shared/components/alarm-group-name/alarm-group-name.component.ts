import { Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import type { AppState } from '../../../state/app.state';
import { selectAlarmGroups } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-alarm-group-name',
    templateUrl: './alarm-group-name.component.html',
    styleUrls: ['./alarm-group-name.component.scss'],
})
export class AlarmGroupNameComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly alarmGroupId = input.required<UUID>();

    private readonly alarmGroups = this.store.selectSignal(selectAlarmGroups);

    public readonly alarmGroup = computed(
        () => this.alarmGroups()[this.alarmGroupId()]
    );
}
