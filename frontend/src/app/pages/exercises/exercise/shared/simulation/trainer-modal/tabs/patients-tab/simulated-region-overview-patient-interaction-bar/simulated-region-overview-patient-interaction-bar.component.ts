import { Component, Input, inject } from '@angular/core';
import type { Mutable, UUIDSet, UUID } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import { SelectPatientService } from '../../../select-patient.service';
import { StartTransferService } from '../../../start-transfer.service';

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

    @Input() patientId!: UUID;

    public removeSelectedPatientFromSimulatedRegion() {
        this.exerciseService.proposeAction({
            type: '[Patient] Remove patient from simulated region',
            patientId: this.patientId,
        });
        this.selectPatientService.selectPatient('');
    }

    public deleteSelectedPatient() {
        this.exerciseService.proposeAction({
            type: '[Patient] Remove patient',
            patientId: this.patientId,
        });
        this.selectPatientService.selectPatient('');
    }

    public initiatePatientTransfer() {
        const patientsToTransfer: Mutable<UUIDSet> = {
            [this.patientId]: true,
        };
        this.startTransferService.initiateNewTransferFor({
            patientsToTransfer,
        });
    }
}
