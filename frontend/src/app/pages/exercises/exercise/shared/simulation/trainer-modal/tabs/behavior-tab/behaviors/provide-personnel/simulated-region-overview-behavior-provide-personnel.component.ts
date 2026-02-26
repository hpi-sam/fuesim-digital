import type { OnDestroy, OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ProvidePersonnelBehaviorState,
    VehicleTemplate,
    UUID,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map, Subject, takeUntil } from 'rxjs';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ExerciseService } from '../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../state/app.state';
import {
    createSelectBehaviorState,
    selectVehicleTemplates,
} from '../../../../../../../../../../state/application/selectors/exercise.selectors';

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
    private readonly exerciseService = inject(ExerciseService);
    readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();

    public vehicleTemplatesToAdd$!: Observable<readonly VehicleTemplate[]>;
    public vehicleTemplatesCurrent$!: Observable<readonly VehicleTemplate[]>;

    private ownPriorities!: readonly UUID[];

    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        const behaviorState$ = this.store.select(
            createSelectBehaviorState<ProvidePersonnelBehaviorState>(
                this.simulatedRegionId(),
                this.behaviorId()
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
            (templates, ownIds) => ownIds.map((id) => templates[id]!)
        );
        this.vehicleTemplatesToAdd$ = combineLatest(
            [availableVehicleTemplates$, ownVehicleTemplateIds$],
            (templates, ownIds) =>
                Object.values(templates).filter(
                    (template) => !ownIds.includes(template.id)
                )
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
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.behaviorId(),
                priorities: newPriorities,
            },
            true
        );
    }
}
