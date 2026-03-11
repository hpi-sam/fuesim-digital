import type { OnDestroy, OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientStatus, UUID } from 'fuesim-digital-shared';
import { Patient } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import type { AppState } from '../../../../../../../../../../../state/app.state';
import {
    createSelectPatient,
    selectPersonnel,
    selectConfiguration,
} from '../../../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector:
        'app-simulated-region-overview-behavior-treat-patients-patient-details',
    templateUrl:
        './simulated-region-overview-behavior-treat-patients-patient-details.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-treat-patients-patient-details.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorTreatPatientsPatientDetailsComponent
    implements OnInit, OnDestroy
{
    private readonly store = inject<Store<AppState>>(Store);

    readonly patientId = input.required<UUID>();
    readonly cateringsActive = input.required<boolean>();

    public caterings$!: Observable<
        {
            personnelType: string;
            typeName: string;
            typeAbbreviation: string;
            assignedPatientCount: number;
        }[]
    >;
    public visibleStatus$?: Observable<PatientStatus>;
    public patient$!: Observable<Patient>;
    public destroy$ = new Subject<void>();
    ngOnDestroy(): void {
        this.destroy$.next();
    }

    ngOnInit(): void {
        const patientSelector = createSelectPatient(this.patientId());

        this.caterings$ = this.store
            .select(
                createSelector(
                    selectPersonnel,
                    patientSelector,
                    (personnel, patient) =>
                        Object.keys(patient.assignedPersonnelIds)
                            .map((personnelId) => personnel[personnelId])
                            .filter((person) => person !== undefined)
                            .map((person) => ({
                                personnelType: person.personnelType,
                                typeName: person.typeName,
                                typeAbbreviation: person.typeAbbreviation,
                                assignedPatientCount: Object.values(
                                    person.assignedPatientIds
                                ).length,
                            }))
                )
            )
            .pipe(
                distinctUntilChanged(
                    (a, b) =>
                        Array.isArray(a) &&
                        Array.isArray(b) &&
                        a.length === b.length &&
                        a.every(
                            (val, index) =>
                                val.assignedPatientCount ===
                                    b[index]?.assignedPatientCount &&
                                val.personnelType === b[index].personnelType
                        )
                ),
                takeUntil(this.destroy$)
            );

        this.patient$ = this.store.select(patientSelector);

        this.visibleStatus$ = this.store.select(
            createSelector(
                patientSelector,
                selectConfiguration,
                (patient, configuration) =>
                    Patient.getVisibleStatus(
                        patient,
                        configuration.pretriageEnabled,
                        configuration.bluePatientsEnabled
                    )
            )
        );
    }
}
