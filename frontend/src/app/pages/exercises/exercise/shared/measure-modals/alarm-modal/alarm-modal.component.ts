import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { getTransferPointFullName } from 'fuesim-digital-shared';
import type { AppState } from '../../../../../../state/app.state';
import {
    createSelectAlarmGroup,
    createSelectTransferPoint,
    selectAlarmGroups,
    selectTransferPoints,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-alarm-modal',
    templateUrl: './alarm-modal.component.html',
    styleUrl: './alarm-modal.component.scss',
    imports: [FormsModule],
})
export class AlarmModalComponent {
    activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);

    private readonly transferPoints =
        this.store.selectSignal(selectTransferPoints);
    private readonly alarmGroups = this.store.selectSignal(selectAlarmGroups);

    public alarmGroupIds: UUID[] = [];
    public targetTransferPointIds: UUID[] = [];

    public readonly selectedAlarmGroupId = signal<UUID | null>(null);
    public readonly selectedTargetTransferPointId = signal<UUID | null>(null);

    public alarmGroupNames: { id: UUID; name: string }[] = [];
    public transferPointNames: { id: UUID; name: string }[] = [];

    public initialize(alarmGroupIds: UUID[], targetTransferPointIds: UUID[]) {
        this.alarmGroupIds = alarmGroupIds;
        this.targetTransferPointIds = targetTransferPointIds;

        if (alarmGroupIds.length > 0) {
            this.alarmGroupNames = alarmGroupIds.map((id) => {
                const ag = selectStateSnapshot(
                    createSelectAlarmGroup(id),
                    this.store
                );
                return { id, name: ag.name };
            });
        } else {
            const allAlarmGroups = this.alarmGroups();
            this.alarmGroupNames = Object.entries(allAlarmGroups).map(
                ([id, ag]) => ({ id, name: ag.name })
            );
        }

        if (targetTransferPointIds.length > 0) {
            this.transferPointNames = targetTransferPointIds.map((id) => {
                const tp = selectStateSnapshot(
                    createSelectTransferPoint(id),
                    this.store
                );
                return { id, name: getTransferPointFullName(tp) };
            });
        } else {
            const allTransferPoints = this.transferPoints();
            this.transferPointNames = Object.entries(allTransferPoints).map(
                ([id, tp]) => ({ id, name: getTransferPointFullName(tp) })
            );
        }

        if (this.alarmGroupNames.length === 1) {
            this.selectedAlarmGroupId.set(this.alarmGroupNames[0]!.id);
        }
        if (this.transferPointNames.length === 1) {
            this.selectedTargetTransferPointId.set(
                this.transferPointNames[0]!.id
            );
        }
    }

    public get canSubmit() {
        return (
            this.selectedAlarmGroupId() !== null &&
            this.selectedTargetTransferPointId() !== null
        );
    }

    public confirm() {
        if (!this.canSubmit) return;
        this.activeModal.close({
            alarmGroup: this.selectedAlarmGroupId()!,
            targetTransferPointId: this.selectedTargetTransferPointId()!,
        });
    }

    public cancel() {
        this.activeModal.dismiss();
    }
}
