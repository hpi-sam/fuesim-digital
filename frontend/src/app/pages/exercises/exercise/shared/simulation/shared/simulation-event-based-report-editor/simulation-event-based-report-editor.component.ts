import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ReportBehaviorState,
    SimulationBehaviorState,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { StrictObject } from 'digital-fuesim-manv-shared';
import {
    BehaviorSubject,
    map,
    Subject,
    takeUntil,
    type Observable,
} from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectBehaviorState,
    createSelectBehaviorStates,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

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
    standalone: false,
})
export class SimulationEventBasedReportEditorComponent
    implements OnChanges, OnDestroy
{
    @Input() simulatedRegionId!: UUID;
    @Input() reportBehaviorId!: UUID;
    @Input() useHotkeys = false;

    private hotkeyLayer: HotkeyLayer | null = null;

    eventBasedReports: EventBasedReport[] = [];

    reportBehaviorState$!: Observable<ReportBehaviorState>;
    canReport$!: BehaviorSubject<
        Partial<{
            [key in keyof typeof eventBasedReportData]: boolean;
        }>
    >;

    private readonly updateOrDestroy$ = new Subject<void>();

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly hotkeysService: HotkeysService
    ) {
        this.eventBasedReports = StrictObject.entries(eventBasedReportData).map(
            ([eventId, eventDetails]) => ({
                eventId,
                propertyName: eventDetails.propertyName,
                description: eventDetails.description,
                changeCallback: (isEnabled) =>
                    this.updateEventBasedReport(eventId, isEnabled),
                hotkey: new Hotkey(eventDetails.hotkeyKeys, false, () =>
                    this.toggleEventBasedReport(eventId)
                ),
            })
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ('useHotkeys' in changes) {
            if (this.useHotkeys && !this.hotkeyLayer) {
                this.hotkeyLayer = this.hotkeysService.createLayer();
                this.registerHotkeys();
            } else if (!this.useHotkeys && this.hotkeyLayer) {
                this.hotkeysService.removeLayer(this.hotkeyLayer);
                this.hotkeyLayer = null;
            }
        }

        if ('simulatedRegionId' in changes || 'reportBehaviorId' in changes) {
            this.updateOrDestroy$.next();

            this.reportBehaviorState$ = this.store.select(
                createSelectBehaviorState<ReportBehaviorState>(
                    this.simulatedRegionId,
                    this.reportBehaviorId
                )
            );

            this.canReport$ = new BehaviorSubject({});
            this.store
                .select(createSelectBehaviorStates(this.simulatedRegionId))
                .pipe(
                    map((behaviors) =>
                        StrictObject.fromEntries(
                            StrictObject.entries(eventBasedReportData).map(
                                ([eventId, eventDetails]) => [
                                    eventId,
                                    eventDetails.requiredBehaviors.every(
                                        (requiredBehavior) =>
                                            behaviors.some(
                                                (behavior) =>
                                                    behavior.type ===
                                                    requiredBehavior
                                            )
                                    ),
                                ]
                            )
                        )
                    ),
                    takeUntil(this.updateOrDestroy$)
                )
                .subscribe(this.canReport$);
        }
    }

    ngOnDestroy() {
        if (this.hotkeyLayer) {
            this.hotkeysService.removeLayer(this.hotkeyLayer);
            this.hotkeyLayer = null;
        }

        this.updateOrDestroy$.next();
    }

    registerHotkeys() {
        if (!this.hotkeyLayer) return;

        this.eventBasedReports.forEach((eventBasedReport) => {
            this.hotkeyLayer?.addHotkey(eventBasedReport.hotkey);
        });
    }

    updateEventBasedReport(type: EventId, isEnabled: boolean) {
        this.exerciseService.proposeAction({
            type: eventBasedReportData[type].actionType,
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.reportBehaviorId,
            reportChanges: isEnabled,
        });
    }

    toggleEventBasedReport(eventId: EventId) {
        if (!this.canReport$.getValue()[eventId]) return;

        const reportBehavior = selectStateSnapshot<ReportBehaviorState>(
            createSelectBehaviorState(
                this.simulatedRegionId,
                this.reportBehaviorId
            ),
            this.store
        );

        this.exerciseService.proposeAction({
            type: eventBasedReportData[eventId].actionType,
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.reportBehaviorId,
            reportChanges:
                !reportBehavior[eventBasedReportData[eventId].propertyName],
        });
    }
}
