import type { OnDestroy, OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { PatientStatus, PersonnelType } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { Patient } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectPatient,
    selectConfiguration,
    selectPersonnel,
} from 'src/app/state/application/selectors/exercise.selectors';

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
    @Input() patientId!: UUID;
    @Input() cateringsActive!: boolean;

    public caterings$!: Observable<
        { personnelType: PersonnelType; assignedPatientCount: number }[]
    >;
    public visibleStatus$?: Observable<PatientStatus>;
    public patient$!: Observable<Patient>;
    public destroy$ = new Subject<void>();

    constructor(private readonly store: Store<AppState>) {}
    ngOnDestroy(): void {
        this.destroy$.next();
    }

    ngOnInit(): void {
        const patientSelector = createSelectPatient(this.patientId);

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
