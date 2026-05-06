import { Component, inject, output } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { AlarmGroup, newAlarmGroup, uuid } from 'fuesim-digital-shared';
import {
    CdkDrag,
    CdkDragDrop,
    CdkDragPlaceholder,
    CdkDragPreview,
    CdkDropList,
} from '@angular/cdk/drag-drop';
import { ExerciseService } from '../../../../../core/exercise.service';
import type { AppState } from '../../../../../state/app.state';
import {
    selectAlarmGroups,
    selectVehicleTemplates,
} from '../../../../../state/application/selectors/exercise.selectors';
import { ValuesPipe } from '../../../../../shared/pipes/values.pipe';
import { AlarmGroupItemComponent } from './alarm-group-item/alarm-group-item.component';

@Component({
    selector: 'app-alarm-group-overview-page',
    templateUrl: './alarm-group-overview-page.component.html',
    styleUrls: ['./alarm-group-overview-page.component.scss'],
    imports: [
        AlarmGroupItemComponent,
        AsyncPipe,
        JsonPipe,
        ValuesPipe,
        CdkDropList,
        CdkDrag,
        CdkDragPlaceholder,
        CdkDragPreview,
    ],
})
export class AlarmGroupOverviewPageComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

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

    public addAlarmGroup() {
        this.exerciseService.proposeAction({
            type: '[AlarmGroup] Add AlarmGroup',
            alarmGroup: newAlarmGroup('???'),
        });
    }
}
