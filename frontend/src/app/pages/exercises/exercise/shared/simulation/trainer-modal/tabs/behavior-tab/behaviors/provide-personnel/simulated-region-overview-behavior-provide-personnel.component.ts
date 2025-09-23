import type { OnDestroy, OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ProvidePersonnelBehaviorState,
    VehicleTemplate,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorState,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-simulated-region-overview-behavior-provide-personnel',
    templateUrl:
        './simulated-region-overview-behavior-provide-personnel.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-provide-personnel.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorProvidePersonnelComponent
    implements OnInit, OnDestroy
{
    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;

    public vehicleTemplatesToAdd$!: Observable<readonly VehicleTemplate[]>;
    public vehicleTemplatesCurrent$!: Observable<readonly VehicleTemplate[]>;

    private ownPriorities!: readonly UUID[];

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly exerciseService: ExerciseService,
        public readonly store: Store<AppState>
    ) {}

    ngOnInit(): void {
        const behaviorState$ = this.store.select(
            createSelectBehaviorState<ProvidePersonnelBehaviorState>(
                this.simulatedRegionId,
                this.behaviorId
            )
        );

        const ownVehicleTemplateIds$ = behaviorState$.pipe(
            map((behaviorState) => behaviorState.vehicleTemplatePriorities)
        );
        const availableVehicleTemplates$ = this.store.select(
            selectVehicleTemplates
        );
        this.vehicleTemplatesCurrent$ = combineLatest(
            [availableVehicleTemplates$, ownVehicleTemplateIds$],
            (templates, ownIds) => {
                const templateMap = Object.fromEntries(
                    templates.map((template) => [template.id, template])
                );
                return ownIds.map((id) => templateMap[id]!);
            }
        );
        this.vehicleTemplatesToAdd$ = combineLatest(
            [availableVehicleTemplates$, ownVehicleTemplateIds$],
            (templates, ownIds) =>
                templates.filter((template) => !ownIds.includes(template.id))
        );

        ownVehicleTemplateIds$
            .pipe(takeUntil(this.destroy$))
            .subscribe((ids) => {
                this.ownPriorities = ids;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }

    public vehiclePriorityReorder({
        item: { data: id },
        currentIndex,
    }: CdkDragDrop<UUID[]>) {
        const newPriorities = this.ownPriorities.filter((item) => item !== id);
        newPriorities.splice(currentIndex, 0, id);
        this.proposeVehiclePriorities(newPriorities);
    }

    public vehiclePriorityRemove(id: UUID) {
        this.proposeVehiclePriorities(
            this.ownPriorities.filter((item) => item !== id)
        );
    }

    public vehiclePriorityAdd(id: UUID) {
        this.proposeVehiclePriorities([id, ...this.ownPriorities]);
    }

    private proposeVehiclePriorities(newPriorities: readonly UUID[]) {
        this.exerciseService.proposeAction(
            {
                type: '[ProvidePersonnelBehavior] Update VehiclePriorities',
                simulatedRegionId: this.simulatedRegionId,
                behaviorId: this.behaviorId,
                priorities: newPriorities,
            },
            true
        );
    }
}
