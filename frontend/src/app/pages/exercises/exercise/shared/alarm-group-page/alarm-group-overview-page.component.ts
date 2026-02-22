import { Component, inject, output } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import {
    AlarmGroup,
    cloneDeepMutable,
    newAlarmGroup,
    uuid,
} from 'fuesim-digital-shared';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExerciseService } from '../../../../../core/exercise.service';
import type { AppState } from '../../../../../state/app.state';
import {
    selectAlarmGroups,
    selectVehicleTemplates,
} from '../../../../../state/application/selectors/exercise.selectors';
import { ValuesPipe } from '../../../../../shared/pipes/values.pipe';
import { openAlarmGroupModal } from '../alarm-group-modal/open-alarm-group-modal';
import { AlarmGroupItemComponent } from './alarm-group-item/alarm-group-item.component';

@Component({
    selector: 'app-alarm-group-overview-page',
    templateUrl: './alarm-group-overview-page.component.html',
    styleUrls: ['./alarm-group-overview-page.component.scss'],
    imports: [
        AlarmGroupItemComponent,
        AsyncPipe,
        ValuesPipe,
        CdkDropList,
        CdkDrag,
        NgbDropdownModule,
    ],
})
export class AlarmGroupOverviewPageComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly ngbModal = inject(NgbModal);

    public readonly closeView = output();

    public readonly alarmGroups$ = this.store.select(selectAlarmGroups);

    public readonly vehicleTemplates$ = this.store.selectSignal(
        selectVehicleTemplates
    );

    public onlyAlarmGroupDropPredicate(event: CdkDrag) {
        return (
            typeof event.data === 'object' &&
            'type' in event.data &&
            event.data.type === 'alarmGroup'
        );
    }
    public drop(event: CdkDragDrop<AlarmGroup[]>) {
        const alarmGroup = event.item.data as AlarmGroup;
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Add AlarmGroup',
            alarmGroup: {
                ...alarmGroup,
                id: uuid(),
            },
        });
    }

    public addEmptyAlarmGroup() {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Add AlarmGroup',
            alarmGroup: newAlarmGroup('???'),
        });
    }

    public async addAlarmGroupFromTemplate() {
        const result = await openAlarmGroupModal(this.ngbModal);
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Add AlarmGroup',
            alarmGroup: {
                ...cloneDeepMutable(result),
                id: uuid(),
            },
        });
    }
}
