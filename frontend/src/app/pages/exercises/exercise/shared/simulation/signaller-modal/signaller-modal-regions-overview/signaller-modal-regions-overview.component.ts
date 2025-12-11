import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map, type Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    selectPersonnel,
    selectSimulatedRegions,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-regions-overview',
    templateUrl: './signaller-modal-regions-overview.component.html',
    styleUrls: ['./signaller-modal-regions-overview.component.scss'],
    standalone: false,
})
export class SignallerModalRegionsOverviewComponent implements OnInit {
    regions$!: Observable<
        (
            | {
                  name: string;
                  hasLeader: false;
              }
            | {
                  name: string;
                  hasLeader: true;
                  leaderName: string;
                  leaderVehicleName: string;
              }
        )[]
    >;

    constructor(private readonly store: Store<AppState>) {}

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
                            name: simulatedRegion.name,
                            hasLeader: false as const,
                        };
                    }

                    const leader = personnel[assignLeaderBehavior.leaderId];

                    if (!leader) {
                        return {
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
