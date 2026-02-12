import { Component, inject, Input } from '@angular/core';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { UUID } from 'digital-fuesim-manv-shared';
import { SelectPatientService } from '../../../select-patient.service';
import { StartTransferService } from '../../../start-transfer.service';

@Component({
    selector: 'app-simulated-region-overview-patient-details',
    templateUrl: './simulated-region-overview-patient-details.component.html',
    styleUrls: ['./simulated-region-overview-patient-details.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewPatientDetailsComponent {
    private readonly exerciseService = inject(ExerciseService);
    readonly selectPatientService = inject(SelectPatientService);
    readonly startTransferService = inject(StartTransferService);

    @Input() patientId!: UUID;
}
