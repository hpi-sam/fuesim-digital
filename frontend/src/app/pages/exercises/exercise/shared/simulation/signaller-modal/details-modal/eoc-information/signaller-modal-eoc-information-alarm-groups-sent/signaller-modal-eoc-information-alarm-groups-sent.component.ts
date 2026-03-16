import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '../../../../../../../../../state/app.state';
import { selectAlarmGroups } from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-signaller-modal-eoc-information-alarm-groups-sent',
    templateUrl:
        './signaller-modal-eoc-information-alarm-groups-sent.component.html',
    styleUrls: [
        './signaller-modal-eoc-information-alarm-groups-sent.component.scss',
    ],
})
export class SignallerModalEocInformationAlarmGroupsSentComponent {
    alarmGroupsSent: string[];

    constructor() {
        const store = inject<Store<AppState>>(Store);

        this.alarmGroupsSent = Object.values(
            selectStateSnapshot(selectAlarmGroups, store)
        )
            .filter((alarmGroup) => alarmGroup.triggerCount > 0)
            .map((alarmGroup) => alarmGroup.name)
            .sort((a, b) => a.localeCompare(b));
    }
}
