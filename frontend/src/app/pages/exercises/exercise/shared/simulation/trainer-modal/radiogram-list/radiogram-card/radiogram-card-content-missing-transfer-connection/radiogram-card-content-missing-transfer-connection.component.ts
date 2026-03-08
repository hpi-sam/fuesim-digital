import type { OnInit } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    MissingTransferConnectionRadiogram,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    createSelectRadiogram,
    selectTransferPoints,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-missing-transfer-connection',
    templateUrl:
        './radiogram-card-content-missing-transfer-connection.component.html',
    styleUrls: [
        './radiogram-card-content-missing-transfer-connection.component.scss',
    ],
    standalone: false,
})
export class RadigoramCardContentMissingTransferConnectionComponent
    implements OnInit
{
    private readonly store = inject<Store<AppState>>(Store);

    @Input() radiogramId!: UUID;

    transferPointName$!: Observable<string>;

    ngOnInit(): void {
        const radiogram$ = this.store.select(
            createSelectRadiogram<MissingTransferConnectionRadiogram>(
                this.radiogramId
            )
        );

        const transferPoints$ = this.store.select(selectTransferPoints);

        this.transferPointName$ = combineLatest([
            radiogram$,
            transferPoints$,
        ]).pipe(
            map(
                ([radiogram, transferPoints]) =>
                    transferPoints[radiogram.targetTransferPointId]
                        ?.externalName ?? 'Unbekannt'
            )
        );
    }
}
