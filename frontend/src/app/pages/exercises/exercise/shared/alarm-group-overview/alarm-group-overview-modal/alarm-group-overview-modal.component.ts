import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { AlarmGroup } from 'fuesim-digital-shared';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectAlarmGroups,
    selectVehicleTemplates,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { AlarmGroupItemComponent } from '../alarm-group-item/alarm-group-item.component';
import { ValuesPipe } from '../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-alarm-group-overview-modal',
    templateUrl: './alarm-group-overview-modal.component.html',
    styleUrls: ['./alarm-group-overview-modal.component.scss'],
    imports: [AlarmGroupItemComponent, AsyncPipe, ValuesPipe],
})
export class AlarmGroupOverviewModalComponent {
    activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    public exerciseId!: string;

    public readonly alarmGroups$ = this.store.select(selectAlarmGroups);

    public readonly vehicleTemplates$ = this.store.select(
        selectVehicleTemplates
    );

    public close() {
        this.activeModal.close();
    }

    public addAlarmGroup() {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Add AlarmGroup',
            alarmGroup: AlarmGroup.create('???'),
        });
    }
}
