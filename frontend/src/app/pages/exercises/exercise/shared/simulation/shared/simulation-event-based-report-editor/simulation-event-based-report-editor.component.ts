import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ReportBehaviorState,
    SimulationBehaviorState,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { StrictObject } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service';
import type { AppState } from 'src/app/state/app.state';
import { createSelectBehaviorState } from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

type EnabledKey = Exclude<
    keyof ReportBehaviorState,
    keyof SimulationBehaviorState | 'activityIds'
>;

const eventBasedReportData = {
    treatmentProgressChange: {
        actionType: '[ReportBehavior] Update report treatment status changes',
        enabledKey: 'reportTreatmentProgressChanges',
        description: 'Wenn sich der Behandlungsstatus ändert',
        hotkeyKeys: 'J',
    },
    transferOfCategoryInSingleRegionCompleted: {
        actionType:
            '[ReportBehavior] Update report transfer of category in single region completed',
        enabledKey: 'reportTransferOfCategoryInSingleRegionCompleted',
        description:
            'Wenn in dieser Patientenablage alle Patienten einer SK abtransportiert wurden',
        hotkeyKeys: 'K',
    },
    transferOfCategoryInMultipleRegionsCompleted: {
        actionType:
            '[ReportBehavior] Update report transfer of category in multiple regions completed',
        enabledKey: 'reportTransferOfCategoryInMultipleRegionsCompleted',
        description:
            'Wenn in allen Patientenablagen dieser Transportorganisation alle Patienten einer SK abtransportiert wurden',
        hotkeyKeys: 'L',
    },
} as const;

type EventId = keyof typeof eventBasedReportData;

interface EventBasedReport {
    eventId: EventId;
    description: string;
    enabledKey: EnabledKey;
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

    eventBasedReports: EventBasedReport[];

    reportBehaviorState$!: Observable<ReportBehaviorState>;

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly hotkeysService: HotkeysService
    ) {
        this.eventBasedReports = StrictObject.entries(eventBasedReportData).map(
            ([eventId, eventDetails]) => ({
                eventId,
                enabledKey: eventDetails.enabledKey,
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
            this.reportBehaviorState$ = this.store.select(
                createSelectBehaviorState<ReportBehaviorState>(
                    this.simulatedRegionId,
                    this.reportBehaviorId
                )
            );
        }
    }

    ngOnDestroy() {
        if (this.hotkeyLayer) {
            this.hotkeysService.removeLayer(this.hotkeyLayer);
            this.hotkeyLayer = null;
        }
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
                !reportBehavior[eventBasedReportData[eventId].enabledKey],
        });
    }
}
