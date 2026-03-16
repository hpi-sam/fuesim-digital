import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ManagePatientTransportToHospitalBehaviorState,
    SimulatedRegion,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../../../state/app.state';
import {
    createSelectBehaviorState,
    selectSimulatedRegions,
} from '../../../../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-manage-patient-transport-to-hospital-request-target-editor',
    templateUrl:
        './manage-patient-transport-to-hospital-request-target-editor.component.html',
    styleUrls: [
        './manage-patient-transport-to-hospital-request-target-editor.component.scss',
    ],
    imports: [FormsModule, AsyncPipe],
})
export class ManagePatientTransportToHospitalRequestTargetEditorComponent
    implements OnChanges
{
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();

    public behaviorState$!: Observable<ManagePatientTransportToHospitalBehaviorState>;
    public possibleRequestTargets$!: Observable<SimulatedRegion[]>;

    ngOnChanges(): void {
        this.behaviorState$ = this.store.select(
            createSelectBehaviorState<ManagePatientTransportToHospitalBehaviorState>(
                this.simulatedRegionId(),
                this.behaviorId()
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
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.behaviorId(),
            });
            return;
        }
        this.exerciseService.proposeAction({
            type: '[ManagePatientsTransportToHospitalBehavior] Change Transport Request Target',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
            requestTargetId,
        });
    }
}
