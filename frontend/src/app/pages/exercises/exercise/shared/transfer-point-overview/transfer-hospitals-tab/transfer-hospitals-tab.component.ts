import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Hospital, TransferPoint, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    createSelectTransferPoint,
    selectHospitals,
} from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-transfer-hospitals-tab',
    templateUrl: './transfer-hospitals-tab.component.html',
    styleUrls: ['./transfer-hospitals-tab.component.scss'],
    standalone: false,
})
export class TransferHospitalsTabComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    public readonly transferPointId = input.required<UUID>();

    public transferPoint$!: Observable<TransferPoint>;

    public reachableHospitals$!: Observable<
        { id: UUID; name: string; transportDuration: number }[]
    >;

    public hospitalsToBeAdded$!: Observable<{ [key: UUID]: Hospital }>;

    ngOnInit() {
        this.transferPoint$ = this.store.select(
            createSelectTransferPoint(this.transferPointId())
        );

        const hospitals$ = this.store.select(selectHospitals);

        this.hospitalsToBeAdded$ = combineLatest([
            this.transferPoint$,
            hospitals$,
        ]).pipe(
            map(([transferPoint, hospitals]) => {
                {
                    return Object.fromEntries(
                        Object.entries(hospitals).filter(
                            ([key]) => !transferPoint.reachableHospitals[key]
                        )
                    );
                }
            })
        );

        this.reachableHospitals$ = combineLatest([
            this.transferPoint$,
            hospitals$,
        ]).pipe(
            map(([transferPoint, hospitals]) =>
                Object.entries(transferPoint.reachableHospitals)
                    .map(([key]) => ({
                        id: key,
                        name: hospitals[key]?.name ?? '',
                        transportDuration:
                            hospitals[key]?.transportDuration ?? 0,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))
            )
        );
    }

    public getHospitalOrderByValue: (hospital: Hospital) => string = (
        hospital
    ) => hospital.name;

    public connectHospital(hospitalId: UUID) {
        this.exerciseService.proposeAction({
            type: '[TransferPoint] Connect hospital',
            transferPointId: this.transferPointId(),
            hospitalId,
        });
    }

    public disconnectHospital(hospitalId: UUID) {
        this.exerciseService.proposeAction({
            type: '[TransferPoint] Disconnect hospital',
            transferPointId: this.transferPointId(),
            hospitalId,
        });
    }
}
