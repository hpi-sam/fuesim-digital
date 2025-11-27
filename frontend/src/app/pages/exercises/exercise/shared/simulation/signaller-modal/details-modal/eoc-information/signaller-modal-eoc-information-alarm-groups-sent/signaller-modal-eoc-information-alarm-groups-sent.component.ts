import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from 'src/app/state/app.state';
import { selectAlarmGroups } from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

@Component({
    selector: 'app-signaller-modal-eoc-information-alarm-groups-sent',
    templateUrl:
        './signaller-modal-eoc-information-alarm-groups-sent.component.html',
    styleUrls: [
        './signaller-modal-eoc-information-alarm-groups-sent.component.scss',
    ],
    standalone: false,
})
export class SignallerModalEocInformationAlarmGroupsSentComponent {
    alarmGroupsSent: string[];

    constructor(store: Store<AppState>) {
        this.alarmGroupsSent = Object.values(
            selectStateSnapshot(selectAlarmGroups, store)
        )
            .filter((alarmGroup) => alarmGroup.sent)
            .map((alarmGroup) => alarmGroup.name)
            .sort((a, b) => a.localeCompare(b));
    }
}
