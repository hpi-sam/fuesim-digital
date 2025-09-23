import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { TransferConnectionsRadiogram } from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { combineLatest, map, type Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectRadiogram,
    selectSimulatedRegions,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-transfer-connections',
    templateUrl: './radiogram-card-content-transfer-connections.component.html',
    styleUrls: ['./radiogram-card-content-transfer-connections.component.scss'],
    standalone: false,
})
export class RadiogramCardContentTransferConnectionsComponent
    implements OnInit
{
    @Input() radiogramId!: UUID;

    connectedRegions$!: Observable<{ name: string; duration: number }[]>;

    constructor(private readonly store: Store<AppState>) {}

    ngOnInit(): void {
        const radiogram$ = this.store.select(
            createSelectRadiogram<TransferConnectionsRadiogram>(
                this.radiogramId
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
