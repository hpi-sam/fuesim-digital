import { Component, input, inject } from '@angular/core';
import type { UUIDSet, UUID } from 'fuesim-digital-shared';
import { WritableDraft } from 'immer';
import { SelectPatientService } from '../../../select-patient.service';
import { StartTransferService } from '../../../start-transfer.service';
import { ExerciseService } from '../../../../../../../../../core/exercise.service';

@Component({
    selector: 'app-simulated-region-overview-patient-interaction-bar',
    templateUrl:
        './simulated-region-overview-patient-interaction-bar.component.html',
    styleUrls: [
        './simulated-region-overview-patient-interaction-bar.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewPatientInteractionBarComponent {
    private readonly exerciseService = inject(ExerciseService);
    readonly selectPatientService = inject(SelectPatientService);
    readonly startTransferService = inject(StartTransferService);

    readonly patientId = input.required<UUID>();

    public removeSelectedPatientFromSimulatedRegion() {
        this.exerciseService.proposeAction({
            type: '[Patient] Remove patient from simulated region',
            patientId: this.patientId(),
        });
        this.selectPatientService.selectPatient('');
    }

    public deleteSelectedPatient() {
        this.exerciseService.proposeAction({
            type: '[Patient] Remove patient',
            patientId: this.patientId(),
        });
        this.selectPatientService.selectPatient('');
    }

    public initiatePatientTransfer() {
        const patientsToTransfer: WritableDraft<UUIDSet> = {
            [this.patientId()]: true,
        };
        this.startTransferService.initiateNewTransferFor({
            patientsToTransfer,
        });
    }
}
