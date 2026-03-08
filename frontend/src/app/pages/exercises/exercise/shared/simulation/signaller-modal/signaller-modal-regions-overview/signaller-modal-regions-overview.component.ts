import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { UUID } from 'fuesim-digital-shared';
import { combineLatest, map, type Observable } from 'rxjs';
import type { AppState } from '../../../../../../../state/app.state';
import {
    selectSimulatedRegions,
    selectPersonnel,
} from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-regions-overview',
    templateUrl: './signaller-modal-regions-overview.component.html',
    styleUrls: ['./signaller-modal-regions-overview.component.scss'],
    standalone: false,
})
export class SignallerModalRegionsOverviewComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    regions$!: Observable<
        (
            | {
                  id: UUID;
                  name: string;
                  hasLeader: false;
              }
            | {
                  id: UUID;
                  name: string;
                  hasLeader: true;
                  leaderName: string;
                  leaderVehicleName: string;
              }
        )[]
    >;

    ngOnInit() {
        const simulatedRegions$ = this.store.select(selectSimulatedRegions);
        const personnel$ = this.store.select(selectPersonnel);

        this.regions$ = combineLatest([simulatedRegions$, personnel$]).pipe(
            map(([simulatedRegions, personnel]) =>
                Object.values(simulatedRegions).map((simulatedRegion) => {
                    const assignLeaderBehavior = simulatedRegion.behaviors.find(
                        (behavior) => behavior.type === 'assignLeaderBehavior'
                    );

                    if (!assignLeaderBehavior?.leaderId) {
                        return {
                            id: simulatedRegion.id,
                            name: simulatedRegion.name,
                            hasLeader: false as const,
                        };
                    }

                    const leader = personnel[assignLeaderBehavior.leaderId];

                    if (!leader) {
                        return {
                            id: simulatedRegion.id,
                            name: simulatedRegion.name,
                            hasLeader: false as const,
                        };
                    }

                    return {
                        id: simulatedRegion.id,
                        name: simulatedRegion.name,
                        hasLeader: true as const,
                        leaderName: leader.typeName,
                        leaderVehicleName: leader.vehicleName,
                    };
                })
            ),
            map((regions) =>
                regions.sort((a, b) => a.name.localeCompare(b.name))
            )
        );
    }
}
