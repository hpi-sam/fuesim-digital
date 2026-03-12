import { Component, inject, input } from '@angular/core';
import type { UUID } from 'fuesim-digital-shared';
import { SelectPatientService } from '../../../select-patient.service';
import { StartTransferService } from '../../../start-transfer.service';
import { ExerciseService } from '../../../../../../../../../core/exercise.service';
import { PatientsDetailsComponent } from '../../../../../../../../../shared/components/patients-details/patients-details.component';
import { SimulatedRegionOverviewPatientInteractionBarComponent } from '../interaction-bar/simulated-region-overview-patient-interaction-bar.component';

@Component({
    selector: 'app-simulated-region-overview-patient-details',
    templateUrl: './simulated-region-overview-patient-details.component.html',
    styleUrls: ['./simulated-region-overview-patient-details.component.scss'],
    imports: [
        PatientsDetailsComponent,
        SimulatedRegionOverviewPatientInteractionBarComponent,
    ],
})
export class SimulatedRegionOverviewPatientDetailsComponent {
    private readonly exerciseService = inject(ExerciseService);
    readonly selectPatientService = inject(SelectPatientService);
    readonly startTransferService = inject(StartTransferService);

    readonly patientId = input.required<UUID>();
}
