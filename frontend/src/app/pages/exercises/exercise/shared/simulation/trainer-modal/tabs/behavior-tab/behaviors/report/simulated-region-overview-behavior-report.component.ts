import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    RecurringEventActivityState,
    ReportableInformation,
    ReportBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import {
    reportableInformationTypeToGermanNameDictionary,
    reportableInformations,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../state/app.state';
import {
    createSelectBehaviorState,
    createSelectActivityStates,
    selectCurrentTime,
} from '../../../../../../../../../../state/application/selectors/exercise.selectors';
import { SimulationEventBasedReportEditorComponent } from '../../../../../shared/simulation-event-based-report-editor/simulation-event-based-report-editor.component';
import { AppSaveOnTypingDirective } from '../../../../../../../../../../shared/directives/app-save-on-typing.directive';

@Component({
    selector: 'app-simulated-region-overview-behavior-report',
    templateUrl: './simulated-region-overview-behavior-report.component.html',
    styleUrls: ['./simulated-region-overview-behavior-report.component.scss'],
    imports: [
        NgbCollapse,
        FormsModule,
        SimulationEventBasedReportEditorComponent,
        AppSaveOnTypingDirective,
        AsyncPipe,
        DatePipe,
    ],
})
export class SimulatedRegionOverviewBehaviorReportComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegionId = input.required<UUID>();
    readonly reportBehaviorId = input.required<UUID>();

    reportBehaviorState$!: Observable<ReportBehaviorState>;

    recurringActivities$!: Observable<{
        [key in ReportableInformation]?: RecurringEventActivityState;
    }>;

    currentTime$!: Observable<number>;

    reportableInformations = reportableInformations;
    reportableInformationTranslationMap =
        reportableInformationTypeToGermanNameDictionary;

    createReportCollapsed = true;
    repeatingReport = false;
    selectedInformation: ReportableInformation | 'noSelect' = 'noSelect';

    ngOnInit(): void {
        this.reportBehaviorState$ = this.store.select(
            createSelectBehaviorState<ReportBehaviorState>(
                this.simulatedRegionId(),
                this.reportBehaviorId()
            )
        );

        const activities$ = this.store.select(
            createSelectActivityStates(this.simulatedRegionId())
        );

        this.recurringActivities$ = combineLatest([
            this.reportBehaviorState$,
            activities$,
        ]).pipe(
            map(([reportBehaviorState, activities]) =>
                Object.fromEntries(
                    Object.entries(reportBehaviorState.activityIds)
                        .filter(
                            ([_informationType, activityId]) =>
                                activityId && activities[activityId]
                        )
                        .map(([informationType, activityId]) => [
                            informationType,
                            activities[activityId],
                        ])
                )
            )
        );

        this.currentTime$ = this.store.select(selectCurrentTime);
    }

    updateInterval(informationType: ReportableInformation, interval: string) {
        this.exerciseService.proposeAction({
            type: '[ReportBehavior] Update Recurring Report',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.reportBehaviorId(),
            informationType,
            interval: Number(interval) * 1000 * 60,
        });
    }

    removeRepeatingReports(informationType: ReportableInformation) {
        this.exerciseService.proposeAction({
            type: '[ReportBehavior] Remove Recurring Report',
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.reportBehaviorId(),
            informationType,
        });
    }

    createReports(
        informationType: ReportableInformation | 'noSelect',
        interval: string,
        repeating: boolean
    ) {
        if (informationType === 'noSelect') return;

        if (repeating) {
            this.exerciseService.proposeAction({
                type: '[ReportBehavior] Create Recurring Report',
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.reportBehaviorId(),
                informationType,
                interval: Number(interval) * 1000 * 60,
            });
        } else {
            this.exerciseService.proposeAction({
                type: '[ReportBehavior] Create Report',
                simulatedRegionId: this.simulatedRegionId(),
                informationType,
                interfaceSignallerKey: null,
            });
        }

        this.createReportCollapsed = true;
        this.selectedInformation = 'noSelect';
    }
}
