import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { AlarmGroup, AlarmGroupVehicle } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectVehicleTemplate,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

@Component({
    selector: 'app-alarm-group-item',
    templateUrl: './alarm-group-item.component.html',
    styleUrls: ['./alarm-group-item.component.scss'],
    standalone: false,
})
export class AlarmGroupItemComponent {
    @Input() alarmGroup!: AlarmGroup;

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );

    public renameAlarmGroup(name: string) {
        this.exerciseService.proposeAction(
            {
                type: '[AlarmGroup] Rename AlarmGroup',
                alarmGroupId: this.alarmGroup.id,
                name,
            },
            true
        );
    }

    public removeAlarmGroup() {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Remove AlarmGroup',
            alarmGroupId: this.alarmGroup.id,
        });
    }

    public removeVehicleTemplate(alarmGroupVehicleId: UUID) {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Remove AlarmGroupVehicle',
            alarmGroupId: this.alarmGroup.id,
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
                alarmGroupId: this.alarmGroup.id,
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
            alarmGroupId: this.alarmGroup.id,
            alarmGroupVehicle: AlarmGroupVehicle.create(
                vehicleTemplateId,
                5 * 60 * 1000,
                vehicleTemplate.name
            ),
        });
    }
}
