import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { uuidSchema } from 'fuesim-digital-shared';
import {
    form,
    validateStandardSchema,
    FormField,
    disabled,
} from '@angular/forms/signals';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectAlarmGroups,
    selectTransferPoints,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { ValuesPipe } from '../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-alarm-modal',
    templateUrl: './alarm-modal.component.html',
    styleUrl: './alarm-modal.component.scss',
    imports: [FormsModule, FormField, ValuesPipe],
})
export class AlarmModalComponent {
    activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);

    private readonly alarmGroups = this.store.selectSignal(selectAlarmGroups);
    private readonly transferPoints =
        this.store.selectSignal(selectTransferPoints);

    public readonly allowedAlarmGroups = computed(() =>
        Object.fromEntries(
            Object.entries(this.alarmGroups()).filter((ag) =>
                this.allowedAlarmGroupIds().includes(ag[1].id)
            )
        )
    );
    public readonly allowedTransferPoints = computed(() =>
        Object.fromEntries(
            Object.entries(this.transferPoints()).filter((tp) =>
                this.allowedTransferPointIds().includes(tp[1].id)
            )
        )
    );

    private readonly inputAlarmGroupIds = signal<UUID[]>([]);
    private readonly inputTransferPointIds = signal<UUID[]>([]);

    public readonly allowedAlarmGroupIds = computed(() =>
        this.inputAlarmGroupIds().length === 0
            ? Object.values(this.alarmGroups()).map((v) => v.id)
            : this.inputAlarmGroupIds()
    );
    public readonly allowedTransferPointIds = computed(() =>
        this.inputTransferPointIds().length === 0
            ? Object.values(this.transferPoints()).map((v) => v.id)
            : this.inputTransferPointIds()
    );

    public readonly values = signal({
        alarmGroup: '',
        transferPoint: '',
    });
    public readonly alarmForm = form(this.values, (schemaPath) => {
        disabled(
            schemaPath.alarmGroup,
            () => this.allowedAlarmGroupIds().length === 1
        );
        disabled(
            schemaPath.transferPoint,
            () => this.allowedTransferPointIds().length === 1
        );
        validateStandardSchema(schemaPath.alarmGroup, uuidSchema);
        validateStandardSchema(schemaPath.transferPoint, uuidSchema);
    });

    public initialize(alarmGroupIds: UUID[], transferPointIds: UUID[]) {
        this.inputAlarmGroupIds.set(alarmGroupIds);
        this.inputTransferPointIds.set(transferPointIds);

        this.values.set({
            alarmGroup:
                this.allowedAlarmGroupIds().length === 1
                    ? this.allowedAlarmGroupIds()[0]!
                    : '',
            transferPoint:
                this.allowedTransferPointIds().length === 1
                    ? this.allowedTransferPointIds()[0]!
                    : '',
        });
    }

    public confirm() {
        if (!this.alarmForm().valid()) return;
        this.activeModal.close({
            alarmGroup: this.values().alarmGroup,
            targetTransferPointId: this.values().transferPoint,
        });
    }

    public cancel() {
        this.activeModal.dismiss();
    }
}
