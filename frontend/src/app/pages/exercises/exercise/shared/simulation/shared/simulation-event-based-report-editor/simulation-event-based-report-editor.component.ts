import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, OnInit, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ReportBehaviorState,
    SimulationBehaviorState,
    UUID,
} from 'fuesim-digital-shared';
import { StrictObject } from 'fuesim-digital-shared';
import {
    map,
    of,
    ReplaySubject,
    Subject,
    switchMap,
    takeUntil,
    type Observable,
} from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../state/app.state';
import {
    createSelectBehaviorStates,
    createSelectBehaviorState,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../state/get-state-snapshot';
import type { HotkeyLayer } from '../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../shared/services/hotkeys.service';
import { AppSaveOnTypingDirective } from '../../../../../../../shared/directives/app-save-on-typing.directive';
import { HotkeyIndicatorComponent } from '../../../../../../../shared/components/hotkey-indicator/hotkey-indicator.component';

type ReportPropertyName = Exclude<
    keyof ReportBehaviorState,
    keyof SimulationBehaviorState | 'activityIds'
>;

const eventBasedReportData = {
    treatmentProgressChange: {
        actionType: '[ReportBehavior] Update report treatment status changes',
        propertyName: 'reportTreatmentProgressChanges',
        description: 'Wenn sich der Behandlungsstatus ändert',
        hotkeyKeys: 'J',
        requiredBehaviors: ['treatPatientsBehavior'],
    },
    transferOfCategoryInSingleRegionCompleted: {
        actionType:
            '[ReportBehavior] Update report transfer of category in single region completed',
        propertyName: 'reportTransferOfCategoryInSingleRegionCompleted',
        description:
            'Wenn in dieser Patientenablage alle Patienten einer SK abtransportiert wurden',
        hotkeyKeys: 'K',
        requiredBehaviors: ['treatPatientsBehavior'],
    },
    transferOfCategoryInMultipleRegionsCompleted: {
        actionType:
            '[ReportBehavior] Update report transfer of category in multiple regions completed',
        propertyName: 'reportTransferOfCategoryInMultipleRegionsCompleted',
        description:
            'Wenn in allen Patientenablagen dieser Transportorganisation alle Patienten einer SK abtransportiert wurden',
        hotkeyKeys: 'L',
        requiredBehaviors: ['managePatientTransportToHospitalBehavior'],
    },
} as const;

type EventId = keyof typeof eventBasedReportData;

interface EventBasedReport {
    eventId: EventId;
    description: string;
    propertyName: ReportPropertyName;
    changeCallback: (isEnabled: boolean) => void;
    hotkey: Hotkey;
}

@Component({
    selector: 'app-simulation-event-based-report-editor',
    templateUrl: './simulation-event-based-report-editor.component.html',
    styleUrls: ['./simulation-event-based-report-editor.component.scss'],
    imports: [
        FormsModule,
        AppSaveOnTypingDirective,
        HotkeyIndicatorComponent,
        AsyncPipe,
    ],
})
export class SimulationEventBasedReportEditorComponent
    implements OnChanges, OnDestroy, OnInit
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly hotkeysService = inject(HotkeysService);

    readonly simulatedRegionId = input.required<UUID>();
    readonly reportBehaviorId = input.required<UUID>();
    readonly useHotkeys = input(false);

    private hotkeyLayer: HotkeyLayer | undefined;

    eventBasedReports: EventBasedReport[] = [];

    private readonly simulatedRegionId$ = new ReplaySubject<UUID>(1);
    reportBehaviorState$!: Observable<ReportBehaviorState>;
    canReport$!: Observable<
        Partial<{
            [key in keyof typeof eventBasedReportData]: boolean;
        }>
    >;

    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.canReport$ = this.simulatedRegionId$.pipe(
            switchMap((simulatedRegionId) =>
                simulatedRegionId
                    ? this.store.select(
                          createSelectBehaviorStates(simulatedRegionId)
                      )
                    : of([])
            ),
            map((behaviors) =>
                StrictObject.fromEntries(
                    StrictObject.entries(eventBasedReportData).map(
                        ([eventId, eventDetails]) => [
                            eventId,
                            eventDetails.requiredBehaviors.every(
                                (requiredBehavior) =>
                                    behaviors.some(
                                        (behavior) =>
                                            behavior.type === requiredBehavior
                                    )
                            ),
                        ]
                    )
                )
            ),
            takeUntil(this.destroy$)
        );

        this.eventBasedReports = StrictObject.entries(eventBasedReportData).map(
            ([eventId, eventDetails]) => ({
                eventId,
                propertyName: eventDetails.propertyName,
                description: eventDetails.description,
                changeCallback: (isEnabled) =>
                    this.updateEventBasedReport(eventId, isEnabled),
                hotkey: new Hotkey(
                    eventDetails.hotkeyKeys,
                    false,
                    () => this.toggleEventBasedReport(eventId),
                    this.canReport$.pipe(
                        map((canReport) => !!canReport[eventId])
                    )
                ),
            })
        );

        this.hotkeyLayer = this.hotkeysService.createLayer(
            false,
            this.useHotkeys()
        );
        this.eventBasedReports.forEach((eventBasedReport) => {
            this.hotkeyLayer!.addHotkey(eventBasedReport.hotkey);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ('useHotkeys' in changes && this.hotkeyLayer) {
            this.hotkeyLayer.enabled = this.useHotkeys();
        }

        if ('simulatedRegionId' in changes || 'reportBehaviorId' in changes) {
            const simulatedRegionId = this.simulatedRegionId();
            this.simulatedRegionId$.next(simulatedRegionId);

            this.reportBehaviorState$ = this.store.select(
                createSelectBehaviorState<ReportBehaviorState>(
                    simulatedRegionId,
                    this.reportBehaviorId()
                )
            );
        }
    }

    ngOnDestroy() {
        if (this.hotkeyLayer) this.hotkeysService.removeLayer(this.hotkeyLayer);
        this.destroy$.next();
    }

    updateEventBasedReport(type: EventId, isEnabled: boolean) {
        this.exerciseService.proposeAction({
            type: eventBasedReportData[type].actionType,
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.reportBehaviorId(),
            reportChanges: isEnabled,
        });
    }

    toggleEventBasedReport(eventId: EventId) {
        const reportBehavior = selectStateSnapshot<ReportBehaviorState>(
            createSelectBehaviorState(
                this.simulatedRegionId(),
                this.reportBehaviorId()
            ),
            this.store
        );

        this.exerciseService.proposeAction({
            type: eventBasedReportData[eventId].actionType,
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.reportBehaviorId(),
            reportChanges:
                !reportBehavior[eventBasedReportData[eventId].propertyName],
        });
    }
}
