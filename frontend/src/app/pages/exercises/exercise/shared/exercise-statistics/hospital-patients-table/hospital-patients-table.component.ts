import { Component } from '@angular/core';
import type { Sort } from '@angular/material/sort';
import { Store } from '@ngrx/store';
import { statusNames } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map, startWith, Subject } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    selectHospitalPatients,
    selectHospitals,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-hospital-patients-table',
    templateUrl: './hospital-patients-table.component.html',
    styleUrls: ['./hospital-patients-table.component.scss'],
    standalone: false,
})
export class HospitalPatientsTableComponent {
    constructor(public readonly store: Store<AppState>) {}

    public readonly sortEvent$ = new Subject<Sort>();

    private readonly unsortedRows$: Observable<HospitalPatientsRow[]> =
        combineLatest([
            this.store.select(selectHospitalPatients),
            this.store.select(selectHospitals),
        ]).pipe(
            map(([hospitalPatients, hospitals]) =>
                Object.values(hospitalPatients).map((hospitalPatient) => {
                    const hospital = Object.values(hospitals).find(
                        (_hospital) =>
                            _hospital.patientIds[hospitalPatient.patientId]
                    );
                    const row: HospitalPatientsRow = {
                        patientIdentifier: hospitalPatient.identifier,
                        hospitalName: hospital!.name,
                        arrivalTime: hospitalPatient.arrivalTime,
                        departureTime: hospitalPatient.startTime,
                        patientStatus: statusNames[hospitalPatient.realStatus],
                        vehicleType: hospitalPatient.vehicleType,
                    };
                    return row;
                })
            )
        );

    public readonly sortedRows$: Observable<HospitalPatientsRow[]> =
        combineLatest([
            this.unsortedRows$,
            this.sortEvent$.pipe(
                startWith({
                    active: 'departureTime',
                    direction: 'asc',
                } as Sort)
            ),
        ]).pipe(
            map(([unsortedRows, sort]) => {
                if (!sort.active || sort.direction === '') {
                    return unsortedRows;
                }

                const compareFunction = (
                    a: HospitalPatientsRow,
                    b: HospitalPatientsRow
                ) =>
                    (a[sort.active as keyof HospitalPatientsRow] <
                    b[sort.active as keyof HospitalPatientsRow]
                        ? -1
                        : 1) * (sort.direction === 'asc' ? 1 : -1);
                return [...unsortedRows].sort(compareFunction);
            })
        );
}

// If you update this interface you must also update the `mat-sort-header` in the template.
interface HospitalPatientsRow {
    patientIdentifier: string;
    hospitalName: string;
    patientStatus: string;
    arrivalTime: number;
    departureTime: number;
    vehicleType: string;
}
