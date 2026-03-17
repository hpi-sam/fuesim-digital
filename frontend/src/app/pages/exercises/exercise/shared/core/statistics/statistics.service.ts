import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    currentCoordinatesOf,
    isOnMap,
    loopTroughTime,
    uuid,
    isInSpecificSimulatedRegion,
    cloneDeepMutable,
    isInVehicle,
    isInTransfer,
    isInViewport,
} from 'fuesim-digital-shared';
import type {
    Personnel,
    Client,
    ExerciseState,
    Patient,
    Vehicle,
    WithPosition,
    UUID,
    LogEntry,
} from 'fuesim-digital-shared';
import { countBy } from 'lodash-es';
import { ReplaySubject } from 'rxjs';
import { ApiService } from '../../../../../../core/api.service';
import type { AppState } from '../../../../../../state/app.state';
import { selectCurrentTime } from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import type { StatisticsEntry } from './statistics-entry';
import type { AreaStatistics } from './area-statistics';

@Injectable({
    providedIn: 'root',
})
export class StatisticsService {
    private readonly apiService = inject(ApiService);
    private readonly store = inject<Store<AppState>>(Store);

    public updatingStatistics = false;
    // TODO: When changing the exercise, this still emits the statistics of the previous exercise
    public readonly statistics$ = new ReplaySubject<readonly StatisticsEntry[]>(
        1
    );

    public readonly logEntries$ = new ReplaySubject<readonly LogEntry[]>(1);

    // TODO: Already calculated statistics could be cached
    // TODO: Maybe calculate this in a webworker to not block the main thread
    // a short test showed that the calculating in the webworker (excluding communication, structuredClone etc.)
    // was ca. half as fast as on the main thread
    private readonly maximumNumberOfDataPoints = 200;
    public async updateStatistics(): Promise<readonly StatisticsEntry[]> {
        this.updatingStatistics = true;
        // The statistics during timeTravel are only up onto the respective point.
        const maximumExerciseTime = selectStateSnapshot(
            selectCurrentTime,
            this.store
        );
        const { initialState, actionsWrappers } = cloneDeepMutable(
            await this.apiService.exerciseHistory()
        );

        initialState.logEntries = [];

        const minimumExerciseTime = initialState.currentTime;

        const generateStatisticsInterval = Math.max(
            (maximumExerciseTime - minimumExerciseTime) /
                this.maximumNumberOfDataPoints,
            // Generate the statistics at most every second
            1000
        );
        const statistics: StatisticsEntry[] = [];
        // Apply all actions (mutable -> fast) and generate in regular intervals a statisticsEntry
        await loopTroughTime(
            initialState,
            actionsWrappers.map(({ action }) => action),
            (stateAtTime) => {
                // Add the statisticsEntry in the last second that should be included
                if (stateAtTime.currentTime >= maximumExerciseTime) {
                    statistics.push(this.generateStatisticsEntry(stateAtTime));
                    return true;
                }
                const previousStatisticsEntry = statistics.at(-1);
                if (
                    // Add the statisticsEntry in the first second
                    !previousStatisticsEntry ||
                    // Add the statisticsEntries every generateStatisticsInterval
                    stateAtTime.currentTime >=
                        previousStatisticsEntry.exerciseTime +
                            generateStatisticsInterval
                ) {
                    statistics.push(this.generateStatisticsEntry(stateAtTime));
                }
                return false;
            }
        );
        this.statistics$.next(statistics);
        this.logEntries$.next(initialState.logEntries);
        this.updatingStatistics = false;
        return statistics;
    }

    private generateStatisticsEntry(
        draftState: ExerciseState
    ): StatisticsEntry {
        const exerciseStatistics = this.generateAreaStatistics(
            Object.values(draftState.clients),
            Object.values(draftState.patients),
            Object.values(draftState.vehicles),
            Object.values(draftState.personnel)
        );

        const viewportStatistics = this.generateFilteredAreaStatistics(
            draftState,
            draftState.viewports,
            (viewport, element) =>
                isOnMap(element) &&
                isInViewport(viewport, currentCoordinatesOf(element)),
            true
        );
        const simulatedRegionsStatistics = this.generateFilteredAreaStatistics(
            draftState,
            draftState.simulatedRegions,
            (simulatedRegion, element) =>
                isInSpecificSimulatedRegion(element, simulatedRegion.id)
        );
        return {
            id: uuid(),
            exercise: exerciseStatistics,
            viewports: viewportStatistics,
            simulatedRegions: simulatedRegionsStatistics,
            exerciseTime: draftState.currentTime,
        };
    }

    private generateFilteredAreaStatistics<T>(
        draftState: ExerciseState,
        areas: { readonly [key: UUID]: T },
        isInArea: (area: T, element: WithPosition) => boolean,
        clients = false
    ) {
        return Object.fromEntries(
            Object.entries(areas).map(([id, area]) => {
                const isInThisArea = (element: WithPosition) =>
                    isInArea(area, element);
                return [
                    id,
                    this.generateAreaStatistics(
                        clients
                            ? Object.values(draftState.clients).filter(
                                  (client) =>
                                      client.viewRestrictedToViewportId === id
                              )
                            : [],
                        Object.values(draftState.patients).filter(isInThisArea),
                        Object.values(draftState.vehicles).filter(isInThisArea),
                        Object.values(draftState.personnel).filter(isInThisArea)
                    ),
                ];
            })
        );
    }

    private generateAreaStatistics(
        clients: Client[],
        patients: Patient[],
        vehicles: Vehicle[],
        personnel: Personnel[]
    ): AreaStatistics {
        return {
            numberOfActiveParticipants: clients.filter(
                (client) =>
                    !client.isInWaitingRoom &&
                    client.role.mainRole === 'participant'
            ).length,
            patients: countBy(patients, (patient) => patient.realStatus),
            vehicles: countBy(vehicles, (vehicle) => vehicle.templateId),
            personnel: countBy(
                personnel.filter(
                    (_personnel) =>
                        !isInVehicle(_personnel) && !isInTransfer(_personnel)
                ),
                (_personnel) => _personnel.templateId
            ),
        };
    }
}
