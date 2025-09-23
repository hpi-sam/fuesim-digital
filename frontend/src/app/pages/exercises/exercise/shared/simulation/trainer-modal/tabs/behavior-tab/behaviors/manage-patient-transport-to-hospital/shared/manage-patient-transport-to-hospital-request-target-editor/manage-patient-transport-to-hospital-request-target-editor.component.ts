import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    SimulatedRegion,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorState,
    selectSimulatedRegions,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-manage-patient-transport-to-hospital-request-target-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-request-target-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-request-target-editor.component.scss',
    ],
    standalone: false,
})
export class ManagePatientTransportToHospitalRequestTargetEditorComponent
    implements OnChanges
{
    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;
    public possibleRequestTargets$!: Observable<SimulatedRegion[]>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    ngOnChanges(): void {
        this.behaviorState$ = this.store.select(
            createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                this.simulatedRegionId,
                this.behaviorId
            )
        );

        const simulatedRegions$ = this.store.select(selectSimulatedRegions);

        this.possibleRequestTargets$ = simulatedRegions$.pipe(
            map((simulatedRegions) =>
                Object.values(simulatedRegions).sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
            )
        );
    }

    changeRequestTarget(requestTargetId: UUID | 'noTarget') {
        if (requestTargetId === 'noTarget') {
            this.exerciseService.proposeAction({
                type: '[ManagePatientsTransportToHospitalBehavior] Change Transport Request Target',
                simulatedRegionId: this.simulatedRegionId,
                behaviorId: this.behaviorId,
            });
            return;
        }
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Change Transport Request Target',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            requestTargetId,
        });
    }
}
