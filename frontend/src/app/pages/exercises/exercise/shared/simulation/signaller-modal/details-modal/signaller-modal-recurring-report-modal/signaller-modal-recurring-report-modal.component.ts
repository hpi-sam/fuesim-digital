import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, ReportableInformation } from 'fuesim-digital-shared';
import { reportableInformationTypeToGermanNameDictionary } from 'fuesim-digital-shared';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import { MessageService } from '../../../../../../../../core/messages/message.service';
import type { AppState } from '../../../../../../../../state/app.state';
import {
    createSelectBehaviorStatesByType,
    createSelectActivityStatesByType,
} from '../../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../../state/get-state-snapshot';

const defaultInterval = 15 * 60 * 1000; // 15 minutes

@Component({
    selector: 'app-signaller-modal-recurring-report-modal',
    templateUrl: './signaller-modal-recurring-report-modal.component.html',
    styleUrls: ['./signaller-modal-recurring-report-modal.component.scss'],
    standalone: false,
})
export class SignallerModalRecurringReportModalComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly detailsModal = inject(SignallerModalDetailsService);
    private readonly messageService = inject(MessageService);

    readonly simulatedRegionId = input.required<UUID>();

    readonly informationType = input.required<ReportableInformation>();

    public get humanReadableReportType() {
        return reportableInformationTypeToGermanNameDictionary[
            this.informationType()
        ];
    }

    public reportBehaviorId: UUID | null = null;
    public recurringActivityId: UUID | null = null;
    public reportsEnabled = false;
    public reportIntervalMilliseconds = defaultInterval;

    public loading = false;

    ngOnInit() {
        const reportBehavior = selectStateSnapshot(
            createSelectBehaviorStatesByType(
                this.simulatedRegionId(),
                'reportBehavior'
            ),
            this.store
        )[0];
        const recurringActivities = selectStateSnapshot(
            createSelectActivityStatesByType(
                this.simulatedRegionId(),
                'recurringEventActivity'
            ),
            this.store
        );

        if (reportBehavior !== undefined) {
            this.reportBehaviorId = reportBehavior.id;
            const recurringActivity = recurringActivities.find(
                (activity) =>
                    activity.id ===
                    reportBehavior.activityIds[this.informationType()]
            );

            this.reportsEnabled = !!recurringActivity;
            this.recurringActivityId = recurringActivity?.id ?? null;
            this.reportIntervalMilliseconds =
                recurringActivity?.recurrenceIntervalTime ?? defaultInterval;
        }
    }

    public updateInterval(newIntervalMinutes: string) {
        this.reportIntervalMilliseconds =
            Number(newIntervalMinutes) * 60 * 1000;
    }

    public submit() {
        if (!this.reportBehaviorId) {
            this.close();
            return;
        }

        let actionPromise: Promise<{ success: boolean }> | null = null;

        if (this.reportsEnabled && !this.recurringActivityId) {
            // Reports are currently not enabled but should be
            actionPromise = this.exerciseService.proposeAction({
                type: '[ReportBehavior] Create Recurring Report',
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.reportBehaviorId,
                informationType: this.informationType(),
                interval: this.reportIntervalMilliseconds,
            });
        } else if (this.reportsEnabled && this.recurringActivityId) {
            // Reports are currently enabled and should still be
            actionPromise = this.exerciseService.proposeAction({
                type: '[ReportBehavior] Update Recurring Report',
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.reportBehaviorId,
                informationType: this.informationType(),
                interval: this.reportIntervalMilliseconds,
            });
        } else if (!this.reportsEnabled && this.recurringActivityId) {
            // Reports are currently enabled but should not be
            actionPromise = this.exerciseService.proposeAction({
                type: '[ReportBehavior] Remove Recurring Report',
                simulatedRegionId: this.simulatedRegionId(),
                behaviorId: this.reportBehaviorId,
                informationType: this.informationType(),
            });
        } else {
            // Reports are currently not enabled and should not be
            // Do nothing
            actionPromise = Promise.resolve({ success: true });
        }

        this.loading = true;

        actionPromise.then((result) => {
            this.loading = false;

            if (result.success) {
                this.messageService.postMessage({
                    title: 'Befehl erteilt',
                    body: 'Die Einstellungen für den regelmäßigen Bericht wurden angepasst',
                    color: 'success',
                });
            } else {
                this.messageService.postError({
                    title: 'Fehler beim Erteilen des Befehls',
                    body: 'Die Einstellungen für den regelmäßigen Bericht konnten nicht angepasst werden',
                });
            }

            this.close();
        });
    }

    public close() {
        this.detailsModal.close();
    }
}
