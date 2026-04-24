import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    newSimulatedRegionRequestTargetConfiguration,
    newTraineesRequestTargetConfiguration,
    type RecurringEventActivityState,
    type RequestBehaviorState,
    type UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map, combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../state/app.state';
import {
    selectSimulatedRegions,
    createSelectBehaviorState,
    createSelectActivityStates,
    selectCurrentTime,
} from '../../../../../../../../../../state/application/selectors/exercise.selectors';
import { AppSaveOnTypingDirective } from '../../../../../../../../../../shared/directives/app-save-on-typing.directive';
import { FormatDurationPipe } from '../../../../../../../../../../shared/pipes/format-duration.pipe';
import { KeysPipe } from '../../../../../../../../../../shared/pipes/keys.pipe';

type RequestTargetOption = UUID | 'trainees';

@Component({
    selector: 'app-simulated-region-overview-behavior-request-vehicles',
    templateUrl:
        './simulated-region-overview-behavior-request-vehicles.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-request-vehicles.component.scss',
    ],
    imports: [
        FormsModule,
        AppSaveOnTypingDirective,
        FormatDurationPipe,
        KeysPipe,
        AsyncPipe,
    ],
})
export class RequestVehiclesComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly requestBehaviorId = input.required<UUID>();

    requestBehaviorState$!: Observable<RequestBehaviorState>;

    requestTargetOptions$!: Observable<{
        [key in RequestTargetOption]: string;
    }>;

    nextTimeoutIn$!: Observable<number | undefined>;

    selectedRequestTarget$!: Observable<RequestTargetOption>;

    ngOnChanges(): void {
        this.requestTargetOptions$ = this.store
            .select(selectSimulatedRegions)
            .pipe(
                map((simulatedRegions) => {
                    const options = Object.entries(simulatedRegions)
                        .map(([id, simulatedRegion]) => [
                            id,
                            `[Simuliert] ${simulatedRegion.name}`,
                        ])
                        .filter(
                            ([id, _name]) => id !== this.simulatedRegionId()
                        )
                        .sort(([_id1, name1], [_id2, name2]) =>
                            name1 === name2 ? 0 : name1! < name2! ? -1 : 1
                        );
                    options.unshift(['trainees', 'Die Trainierenden']);
                    return Object.fromEntries(options);
                })
            );

        this.requestBehaviorState$ = this.store.select(
            createSelectBehaviorState(
                this.simulatedRegionId(),
                this.requestBehaviorId()
            )
        );

        this.selectedRequestTarget$ = this.requestBehaviorState$.pipe(
            map((requestBehaviorState) => {
                if (
                    requestBehaviorState.requestTarget.type ===
                    'traineesRequestTarget'
                ) {
                    return 'trainees';
                }
                return requestBehaviorState.requestTarget
                    .targetSimulatedRegionId;
            })
        );

        const activities$ = this.store.select(
            createSelectActivityStates(this.simulatedRegionId())
        );

        const currentTime$ = this.store.select(selectCurrentTime);

        this.nextTimeoutIn$ = combineLatest([
            this.requestBehaviorState$,
            activities$,
            currentTime$,
        ]).pipe(
            map(([requestBehaviorState, activities, currentTime]) => {
                if (!requestBehaviorState.recurringEventActivityId)
                    return undefined;
                const recurringEventActivityState = activities[
                    requestBehaviorState.recurringEventActivityId
                ] as RecurringEventActivityState | undefined;
                if (!recurringEventActivityState) return undefined;

                return Math.max(
                    recurringEventActivityState.lastOccurrenceTime +
                        recurringEventActivityState.recurrenceIntervalTime -
                        currentTime,
                    0
                );
            })
        );
    }

    updateRequestInterval(interval: number) {
        this.exerciseService.proposeAction({
            type: '[RequestBehavior] Update RequestInterval',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.requestBehaviorId(),
            requestInterval: interval,
        });
    }

    updatePromiseInterval(interval: number) {
        this.exerciseService.proposeAction({
            type: '[RequestBehavior] Update Promise invalidation interval',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.requestBehaviorId(),
            promiseInvalidationInterval: interval,
        });
    }

    updateRequestTarget(requestTarget: RequestTargetOption) {
        let requestTargetConfiguration;
        if (requestTarget === 'trainees') {
            requestTargetConfiguration =
                newTraineesRequestTargetConfiguration();
        } else {
            requestTargetConfiguration =
                newSimulatedRegionRequestTargetConfiguration(requestTarget);
        }
        this.exerciseService.proposeAction({
            type: '[RequestBehavior] Update RequestTarget',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.requestBehaviorId(),
            requestTarget: requestTargetConfiguration,
        });
    }
}
