import { Component, inject, OnInit, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { AlarmGroup, AlarmGroupVehicle } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectVehicleTemplates,
    createSelectVehicleTemplate,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-alarm-group-item',
    templateUrl: './alarm-group-item.component.html',
    styleUrls: ['./alarm-group-item.component.scss'],
    standalone: false,
})
export class AlarmGroupItemComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly alarmGroup = input.required<AlarmGroup>();

    ngOnInit() {
        this.hasTriggerLimit = this.alarmGroup().triggerLimit !== null;
        this.triggerLimit = this.alarmGroup().triggerLimit ?? 1;
    }

    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );

    public triggerLimit: number | null = null;
    public hasTriggerLimit = false;

    public toggleTriggerLimit(value: boolean) {
        const prev = this.hasTriggerLimit;
        this.hasTriggerLimit = value;
        if (!value) {
            this.triggerLimit = null;
        } else if (this.alarmGroup().triggerLimit === null) {
            this.triggerLimit = 1;
        }

        if (prev !== value) {
            this.limitAlarmGroup(this.triggerLimit);
        }
    }

    public renameAlarmGroup(name: string) {
        this.exerciseService.proposeAction(
            {
                type: '[AlarmGroup] Rename AlarmGroup',
                alarmGroupId: this.alarmGroup().id,
                name,
            },
            true
        );
    }

    public limitAlarmGroup(limit: number | null) {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Limit AlarmGroup',
            alarmGroupId: this.alarmGroup().id,
            triggerLimit: this.hasTriggerLimit ? (limit ?? null) : null,
        });
    }

    public removeAlarmGroup() {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Remove AlarmGroup',
            alarmGroupId: this.alarmGroup().id,
        });
    }

    public removeVehicleTemplate(alarmGroupVehicleId: UUID) {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Remove AlarmGroupVehicle',
            alarmGroupId: this.alarmGroup().id,
            alarmGroupVehicleId,
        });
    }

    public editAlarmGroupVehicle(
        alarmGroupVehicleId: UUID,
        time: number | null,
        name: string | null
    ) {
        if (time === null) {
            return;
        }
        if (name === null) {
            return;
        }
        this.exerciseService.proposeAction(
            {
                type: '[AlarmGroup] Edit AlarmGroupVehicle',
                alarmGroupId: this.alarmGroup().id,
                alarmGroupVehicleId,
                time,
                name,
            },
            true
        );
    }

    public createAlarmGroupVehicle(vehicleTemplateId: UUID) {
        const vehicleTemplate = selectStateSnapshot(
            createSelectVehicleTemplate(vehicleTemplateId),
            this.store
        );
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Add AlarmGroupVehicle',
            alarmGroupId: this.alarmGroup().id,
            alarmGroupVehicle: AlarmGroupVehicle.create(
                vehicleTemplateId,
                5 * 60 * 1000,
                vehicleTemplate.name
            ),
        });
    }
}
