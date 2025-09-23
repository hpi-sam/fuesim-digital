import type { OnChanges, OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseSimulationBehaviorState,
    ExerciseSimulationBehaviorType,
} from 'digital-fuesim-manv-shared';
import {
    simulationBehaviorDictionary,
    StrictObject,
    SimulatedRegion,
} from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorStates,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import type { TransferOptions } from '../../start-transfer.service';

let globalLastBehaviorType: ExerciseSimulationBehaviorType | undefined;

@Component({
    selector: 'app-simulated-region-overview-behavior-tab',
    templateUrl: './simulated-region-overview-behavior-tab.component.html',
    styleUrls: ['./simulated-region-overview-behavior-tab.component.scss'],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorTabComponent
    implements OnChanges, OnInit
{
    @Input() simulatedRegion!: SimulatedRegion;
    @Input() initialTransferOptions?: TransferOptions;

    public behaviorTypesToBeAdded$!: Observable<
        ExerciseSimulationBehaviorType[]
    >;
    public selectedBehavior?: ExerciseSimulationBehaviorState;

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    async ngOnInit() {
        if (globalLastBehaviorType !== undefined) {
            this.selectedBehavior = this.simulatedRegion.behaviors.find(
                (behavior) => behavior.type === globalLastBehaviorType
            );
        }
        if (this.initialTransferOptions) {
            this.selectedBehavior = this.simulatedRegion.behaviors.find(
                (behavior) => behavior.type === 'transferBehavior'
            );
            if (!this.selectedBehavior) {
                await this.exerciseService.proposeAction({
                    type: '[SimulatedRegion] Add Behavior',
                    simulatedRegionId: this.simulatedRegion.id,
                    behaviorState:
                        simulationBehaviorDictionary.transferBehavior.behaviorState.create(),
                });
                this.selectedBehavior = this.simulatedRegion.behaviors.find(
                    (behavior) => behavior.type === 'transferBehavior'
                );
            }
        }

        this.behaviorTypesToBeAdded$ = this.store
            .select(createSelectBehaviorStates(this.simulatedRegion.id))
            .pipe(
                map((states) => {
                    const currentTypes = new Set(
                        states.map((state) => state.type)
                    );
                    return StrictObject.keys(
                        simulationBehaviorDictionary
                    ).filter((type) => !currentTypes.has(type));
                })
            );
    }

    public ngOnChanges() {
        if (
            // if the selected behavior has been removed by a different client
            this.selectedBehavior !== undefined &&
            !this.simulatedRegion.behaviors.includes(this.selectedBehavior)
        ) {
            this.selectedBehavior = this.simulatedRegion.behaviors.find(
                (behavior) => behavior.id === this.selectedBehavior?.id
            );
        }
    }

    public addBehavior(behaviorType: ExerciseSimulationBehaviorType) {
        const args: any[] = [];
        switch (behaviorType) {
            case 'providePersonnelBehavior':
                args.push(
                    selectStateSnapshot(selectVehicleTemplates, this.store).map(
                        (template) => template.id
                    )
                );
                break;
            default:
                break;
        }
        const behaviorState = simulationBehaviorDictionary[
            behaviorType
        ].behaviorState.create(...args);
        this.exerciseService.proposeAction({
            type: '[SimulatedRegion] Add Behavior',
            simulatedRegionId: this.simulatedRegion.id,
            behaviorState,
        });
    }

    public removeSelectedBehavior() {
        this.exerciseService.proposeAction({
            type: '[SimulatedRegion] Remove Behavior',
            simulatedRegionId: this.simulatedRegion.id,
            behaviorId: this.selectedBehavior!.id,
        });
        this.selectedBehavior = undefined;
    }

    public onBehaviorSelect(behavior: ExerciseSimulationBehaviorState): void {
        this.selectedBehavior = behavior;
        globalLastBehaviorType = behavior.type;
    }
}
