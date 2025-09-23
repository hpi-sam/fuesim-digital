import { Component, Input } from '@angular/core';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Patient, PatientStatus } from 'digital-fuesim-manv-shared';
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
    @Input()
    patients!: PatientWithVisibleStatus[];

    @Input()
    selectedPatientId?: UUID;

    @Input()
    scope!: Scope;

    readonly scopeDescriptions = {
        simulatedRegion: 'im simulierten Bereich',
        vehicle: 'im Fahrzeug',
    } as const;

    constructor(public readonly selectPatientService: SelectPatientService) {}
}
