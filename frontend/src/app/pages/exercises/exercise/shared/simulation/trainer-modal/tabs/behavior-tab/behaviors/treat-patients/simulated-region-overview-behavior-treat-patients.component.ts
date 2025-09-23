import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import type {
    TreatPatientsBehaviorState,
    DelayEventActivityState,
    ReassignTreatmentsActivityState,
} from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorState,
    createSelectElementsInSimulatedRegion,
    createSelectSimulatedRegion,
    selectConfiguration,
    selectCurrentTime,
    selectPatients,
} from 'src/app/state/application/selectors/exercise.selectors';
import { SelectPatientService } from '../../../../select-patient.service';
import { comparePatientsByVisibleStatus } from '../../../compare-patients';

let globalLastSettingsCollapsed = true;
let globalLastInformationCollapsed = true;
@Component({
    selector: 'app-simulated-region-overview-behavior-treat-patients',
    templateUrl:
        './simulated-region-overview-behavior-treat-patients.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-treat-patients.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorTreatPatientsComponent
    implements OnInit
{
    @Input() simulatedRegionId!: UUID;
    @Input() treatPatientsBehaviorId!: UUID;

    public treatPatientsBehaviorState$!: Observable<TreatPatientsBehaviorState>;
    public patientIds$!: Observable<UUID[]>;
    public timeUntilNextRecalculation$!: Observable<number | null>;
    private _settingsCollapsed!: boolean;
    private _informationCollapsed!: boolean;

    public get settingsCollapsed(): boolean {
        return this._settingsCollapsed;
    }
    public set settingsCollapsed(value: boolean) {
        this._settingsCollapsed = value;
        globalLastSettingsCollapsed = value;
    }
    public get informationCollapsed(): boolean {
        return this._informationCollapsed;
    }
    public set informationCollapsed(value: boolean) {
        this._informationCollapsed = value;
        globalLastInformationCollapsed = value;
    }

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        readonly selectPatientService: SelectPatientService
    ) {}

    ngOnInit(): void {
        this.settingsCollapsed = globalLastSettingsCollapsed;
        this.informationCollapsed = globalLastInformationCollapsed;

        this.treatPatientsBehaviorState$ = this.store.select(
            createSelectBehaviorState(
                this.simulatedRegionId,
                this.treatPatientsBehaviorId
            )
        );

        this.patientIds$ = this.store.select(
            createSelector(
                createSelectElementsInSimulatedRegion(
                    selectPatients,
                    this.simulatedRegionId
                ),
                selectConfiguration,
                (patients, configuration) =>
                    patients
                        .sort((patientA, patientB) =>
                            comparePatientsByVisibleStatus(
                                patientA,
                                patientB,
                                configuration
                            )
                        )
                        .map((patient) => patient.id)
            )
        );

        const simulatedRegion$ = this.store.select(
            createSelectSimulatedRegion(this.simulatedRegionId)
        );

        const currentTime$ = this.store.select(selectCurrentTime);

        this.timeUntilNextRecalculation$ = combineLatest([
            this.treatPatientsBehaviorState$,
            simulatedRegion$,
            currentTime$,
            this.patientIds$,
        ]).pipe(
            map(([behaviorState, simulatedRegion, currentTime, patientIds]) => {
                if (behaviorState.treatmentProgress === 'noTreatment')
                    return null;

                if (behaviorState.treatmentProgress === 'unknown') {
                    if (!behaviorState.treatmentActivityId) return null;

                    const reassignActivity = simulatedRegion.activities[
                        behaviorState.treatmentActivityId
                    ] as ReassignTreatmentsActivityState | undefined;
                    if (!reassignActivity) return null;

                    return (
                        (reassignActivity.countingStartedAt ?? currentTime) +
                        reassignActivity.countingTimePerPatient *
                            patientIds.length -
                        currentTime
                    );
                }

                if (behaviorState.delayActivityId === null) return null;

                const delayActivity = simulatedRegion.activities[
                    behaviorState.delayActivityId
                ] as DelayEventActivityState | undefined;
                if (!delayActivity) return 0;

                return delayActivity.endTime - currentTime;
            })
        );
    }

    public updateTreatPatientsBehaviorState(
        unknown?: number,
        counted?: number,
        triaged?: number,
        secured?: number,
        countingTimePerPatient?: number
    ) {
        this.exerciseService.proposeAction({
            type: '[TreatPatientsBehavior] Update TreatPatientsIntervals',
            simulatedRegionId: this.simulatedRegionId,
            behaviorStateId: this.treatPatientsBehaviorId,
            unknown,
            counted,
            triaged,
            secured,
            countingTimePerPatient,
        });
    }
}
