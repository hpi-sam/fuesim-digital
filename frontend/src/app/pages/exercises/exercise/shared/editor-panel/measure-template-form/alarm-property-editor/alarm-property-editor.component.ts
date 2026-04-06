import { Component, computed, inject, input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { getTransferPointFullName } from 'fuesim-digital-shared';
import type { AppState } from '../../../../../../../state/app.state';
import {
    selectAlarmGroups,
    selectTransferPoints,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { AlarmGroupNameComponent } from '../../../../../../../shared/components/alarm-group-name/alarm-group-name.component';
import { TransferPointNameComponent } from '../../../../../../../shared/components/transfer-point-name/transfer-point-name.component';

@Component({
    selector: 'app-alarm-property-editor',
    templateUrl: './alarm-property-editor.component.html',
    styleUrls: ['./alarm-property-editor.component.scss'],
    imports: [
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem,
        AlarmGroupNameComponent,
        TransferPointNameComponent,
    ],
})
export class AlarmPropertyEditorComponent {
    private readonly store = inject<Store<AppState>>(Store);

    readonly alarmGroupIds = input.required<string[]>();
    readonly targetTransferPointIds = input.required<string[]>();

    readonly alarmGroupIdsChange = output<string[]>();
    readonly targetTransferPointIdsChange = output<string[]>();

    private readonly allAlarmGroups =
        this.store.selectSignal(selectAlarmGroups);
    private readonly allTransferPoints =
        this.store.selectSignal(selectTransferPoints);

    public readonly alarmGroupsToAdd = computed(() => {
        const selected = new Set(this.alarmGroupIds());
        return Object.values(this.allAlarmGroups())
            .filter((ag) => !selected.has(ag.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    });

    public readonly transferPointsToAdd = computed(() => {
        const selected = new Set(this.targetTransferPointIds());
        return Object.values(this.allTransferPoints())
            .filter((tp) => !selected.has(tp.id))
            .sort((a, b) =>
                getTransferPointFullName(a).localeCompare(
                    getTransferPointFullName(b)
                )
            );
    });

    public readonly getTransferPointFullName = getTransferPointFullName;

    public addAlarmGroup(id: UUID) {
        this.alarmGroupIdsChange.emit([...this.alarmGroupIds(), id]);
    }

    public removeAlarmGroup(id: string) {
        this.alarmGroupIdsChange.emit(
            this.alarmGroupIds().filter((agId) => agId !== id)
        );
    }

    public addTransferPoint(id: UUID) {
        this.targetTransferPointIdsChange.emit([
            ...this.targetTransferPointIds(),
            id,
        ]);
    }

    public removeTransferPoint(id: string) {
        this.targetTransferPointIdsChange.emit(
            this.targetTransferPointIds().filter((tpId) => tpId !== id)
        );
    }
}
