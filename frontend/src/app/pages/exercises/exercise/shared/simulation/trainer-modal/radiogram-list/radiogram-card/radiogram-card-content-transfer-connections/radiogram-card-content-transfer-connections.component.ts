import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferConnectionsRadiogram, UUID } from 'fuesim-digital-shared';
import { combineLatest, map, type Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../../../../../../../state/app.state';
import {
    createSelectRadiogram,
    selectSimulatedRegions,
} from '../../../../../../../../../state/application/selectors/exercise.selectors';
import { FormatDurationPipe } from '../../../../../../../../../shared/pipes/format-duration.pipe';

@Component({
    selector: 'app-radiogram-card-content-transfer-connections',
    templateUrl: './radiogram-card-content-transfer-connections.component.html',
    styleUrls: ['./radiogram-card-content-transfer-connections.component.scss'],
    imports: [FormatDurationPipe, AsyncPipe],
})
export class RadiogramCardContentTransferConnectionsComponent
    implements OnInit
{
    private readonly store = inject<Store<AppState>>(Store);

    readonly radiogramId = input.required<UUID>();

    connectedRegions$!: Observable<{ name: string; duration: number }[]>;

    ngOnInit(): void {
        const radiogram$ = this.store.select(
            createSelectRadiogram<TransferConnectionsRadiogram>(
                this.radiogramId()
            )
        );

        const simulatedRegions$ = this.store.select(selectSimulatedRegions);

        this.connectedRegions$ = combineLatest([
            radiogram$,
            simulatedRegions$,
        ]).pipe(
            map(([radiogram, simulatedRegions]) =>
                Object.entries(radiogram.connectedRegions)
                    .filter(([id]) => simulatedRegions[id])
                    .map(([id, duration]) => ({
                        name: simulatedRegions[id]!.name,
                        duration,
                    }))
            )
        );
    }
}
