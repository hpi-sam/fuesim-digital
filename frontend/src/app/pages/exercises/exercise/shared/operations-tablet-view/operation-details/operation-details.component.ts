import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { defaultTileMapProperties } from 'digital-fuesim-manv-shared';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { AppState } from '../../../../../../state/app.state';
import {
    selectVehiclesInTransfer,
    selectTransferPoints,
    selectAlarmGroups,
    selectCurrentTime,
    selectParticipantId,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectVisibleVehicles } from '../../../../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-operation-details-tab',
    standalone: false,
    templateUrl: './operation-details.component.html',
    styleUrl: './operation-details.component.scss',
})
export class OperationDetailsTabComponent {

    @Input()
    public showExerciseDetails: boolean = false;

    public constructor(
        private readonly store: Store<AppState>
    ) {}


    public readonly participantId$ = this.store.select(selectParticipantId);
    public readonly currentTime$ = this.store.select(selectCurrentTime)
}
