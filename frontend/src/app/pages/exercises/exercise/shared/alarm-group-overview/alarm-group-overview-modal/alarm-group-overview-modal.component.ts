import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { AlarmGroup } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    selectAlarmGroups,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-alarm-group-overview-modal',
    templateUrl: './alarm-group-overview-modal.component.html',
    styleUrls: ['./alarm-group-overview-modal.component.scss'],
    standalone: false,
})
export class AlarmGroupOverviewModalComponent {
    public exerciseId!: string;

    constructor(
        public activeModal: NgbActiveModal,
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

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
