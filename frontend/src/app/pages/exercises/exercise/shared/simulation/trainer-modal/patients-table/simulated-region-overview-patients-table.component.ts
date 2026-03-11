import { Component, inject, input } from '@angular/core';
import type { UUID, Patient, PatientStatus } from 'fuesim-digital-shared';
import { SelectPatientService } from '../select-patient.service';

export type PatientWithVisibleStatus = Patient & {
    visibleStatus: PatientStatus;
};

export type Scope = 'simulatedRegion' | 'vehicle';

@Component({
    selector: 'app-simulated-region-overview-patients-table',
    templateUrl: './simulated-region-overview-patients-table.component.html',
    styleUrls: ['./simulated-region-overview-patients-table.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewPatientsTableComponent {
    readonly selectPatientService = inject(SelectPatientService);

    readonly patients = input<PatientWithVisibleStatus[]>([]);

    readonly selectedPatientId = input<UUID>();

    readonly scope = input.required<Scope>();

    readonly scopeDescriptions = {
        simulatedRegion: 'im simulierten Bereich',
        vehicle: 'im Fahrzeug',
    } as const;
}
