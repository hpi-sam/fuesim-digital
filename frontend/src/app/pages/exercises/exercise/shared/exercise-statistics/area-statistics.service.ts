import { Injectable } from '@angular/core';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import type { AreaStatistics } from '../core/statistics/area-statistics';
import { StatisticsService } from '../core/statistics/statistics.service';

@Injectable({
    providedIn: 'root',
})
export class AreaStatisticsService {
    private readonly areaSpec: AreaSpec = { type: 'all' };
    public readonly areaSpec$ = new BehaviorSubject<AreaSpec>(this.areaSpec);

    /**
     * Emits the statistics for the current area and the accompanying correct exerciseTime
     */
    public readonly areaStatistics$: Observable<AreaStatisticsEntry[]> =
        combineLatest([
            this.statisticsService.statistics$,
            this.areaSpec$,
        ]).pipe(
            map(
                ([statistics, areaSpec]) =>
                    statistics
                        .map((statisticEntry) => ({
                            value:
                                areaSpec.type === 'all'
                                    ? statisticEntry.exercise
                                    : areaSpec.type === 'viewport'
                                      ? statisticEntry.viewports[areaSpec.id]
                                      : // Safeguard for when new types are added
                                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                                        areaSpec.type === 'simulatedRegion'
                                        ? statisticEntry.simulatedRegions[
                                              areaSpec.id
                                          ]
                                        : undefined,
                            exerciseTime: statisticEntry.exerciseTime,
                        }))
                        .filter(
                            (entry) => entry.value !== undefined
                        ) as AreaStatisticsEntry[]
            )
        );

    constructor(private readonly statisticsService: StatisticsService) {}

    public setArea(areaSpec: AreaSpec) {
        this.areaSpec$.next(areaSpec);
    }
}

export type AreaSpec =
    | { type: 'all' }
    | { type: 'simulatedRegion'; id: UUID }
    | { type: 'viewport'; id: UUID };

export interface AreaStatisticsEntry {
    value: AreaStatistics;
    exerciseTime: number;
}
