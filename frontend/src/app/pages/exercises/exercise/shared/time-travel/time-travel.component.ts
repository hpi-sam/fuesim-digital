import type { OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { currentStateVersion, StateExport } from 'fuesim-digital-shared';
import { throttle } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import type { LogEntry } from 'fuesim-digital-shared';
import { openClientsModal } from '../clients-modal/open-clients-modal';
import { openExerciseStatisticsModal } from '../exercise-statistics/open-exercise-statistics-modal';
import { openTransferOverviewModal } from '../transfer-overview/open-transfer-overview-modal';
import { ApiService } from '../../../../../core/api.service';
import { MessageService } from '../../../../../core/messages/message.service';
import { TimeTravelService } from '../../../../../core/time-travel.service';
import type { AppState } from '../../../../../state/app.state';
import { selectTimeConstraints } from '../../../../../state/application/selectors/application.selectors';
import { selectExerciseState } from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';
import { ExerciseMapComponent } from '../exercise-map/exercise-map.component';
import { FormatDurationPipe } from '../../../../../shared/pipes/format-duration.pipe';
import { HelpButtonComponent } from '../../../../../help-button/help-button.component.js';
import { ExerciseService } from '../../../../../core/exercise.service.js';

@Component({
    selector: 'app-time-travel',
    templateUrl: './time-travel.component.html',
    styleUrls: ['./time-travel.component.scss'],
    imports: [
        ExerciseMapComponent,
        FormsModule,
        AsyncPipe,
        FormatDurationPipe,
        HelpButtonComponent,
    ],
})
export class TimeTravelComponent implements OnDestroy {
    private readonly modalService = inject(NgbModal);
    private readonly apiService = inject(ApiService);
    private readonly timeTravelService = inject(TimeTravelService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
    private readonly exerciseService = inject(ExerciseService);

    public timeConstraints$ = this.store.select(selectTimeConstraints);

    public openClientsModal() {
        openClientsModal(this.modalService);
    }

    public openTransferOverview() {
        openTransferOverviewModal(this.modalService);
    }

    public openExerciseStatisticsModal() {
        openExerciseStatisticsModal(this.modalService);
    }

    // We don't want to make too many time jumps when dragging the slider.
    public readonly jumpToTime = throttle(
        async (time) => {
            this.stopReplay();
            this.timeTravelService.jumpToTime(time);
        },
        250,
        {
            trailing: true,
        }
    );

    /**
     * Whether the exercise is currently automatically replayed.
     */
    public get isReplaying() {
        return this.replayInterval !== undefined;
    }

    // In the editor the type is 'NodeJS.Timer', when building angular it is 'number' -> https://stackoverflow.com/a/59681620
    private replayInterval?: ReturnType<typeof setInterval>;

    public startReplay() {
        this.replayInterval = setInterval(() => {
            const timeConstraints = selectStateSnapshot(
                selectTimeConstraints,
                this.store
            )!;
            if (timeConstraints.current >= timeConstraints.end) {
                this.stopReplay();
                return;
            }
            const prevLogEntries =
                selectStateSnapshot(selectExerciseState, this.store).logEntries
                    ?.length ?? 0;
            this.timeTravelService.jumpToTime(
                timeConstraints.current + 1000 * this.replaySpeed
            );
            const nextLogEntries =
                selectStateSnapshot(selectExerciseState, this.store)
                    .logEntries ?? [];
            const newLogEntries = nextLogEntries.slice(prevLogEntries);

            const onlyMeasures = (e: LogEntry): boolean =>
                e.tags.some((t) => t.category === 'Maßnahme');
            for (const entry of newLogEntries.filter(onlyMeasures)) {
                this.messageService.postMessage({
                    color: 'info',
                    title: 'Maßnahme getroffen',
                    body: entry.description,
                });
            }

            const onlyScoutings = (e: LogEntry): boolean =>
                e.tags.some((t) => t.category === 'Erkundungselement');
            for (const entry of newLogEntries.filter(onlyScoutings)) {
                this.messageService.postMessage({
                    color: 'info',
                    title: 'Element erkundet',
                    body: entry.description,
                });
            }
        }, 1000);
    }

    public stopReplay() {
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
        }
        this.replayInterval = undefined;
    }

    public readonly replaySpeedOptions = [1, 2, 4, 8, 16];
    public replaySpeed = this.replaySpeedOptions[0]!;

    public setReplaySpeed(speed: number) {
        this.replaySpeed = speed;
        if (this.isReplaying) {
            // Update the speed
            this.stopReplay();
            this.startReplay();
        }
    }

    public restartReplay() {
        this.stopReplay();
        const timeConstraints = selectStateSnapshot(
            selectTimeConstraints,
            this.store
        )!;
        this.timeTravelService.jumpToTime(timeConstraints.start);
        this.startReplay();
    }

    public async createNewExerciseFromTheCurrentState() {
        const currentState = selectStateSnapshot(
            selectExerciseState,
            this.store
        );
        const stateExport = {
            type: 'complete',
            fileVersion: 1,
            dataVersion: currentStateVersion,
            currentState,
            history: undefined,
        } satisfies StateExport;

        await this.exerciseService.createExercise(
            stateExport,
            ({ trainerKey }) => {
                this.messageService.postMessage({
                    color: 'success',
                    title: 'Neue Übung erstellt',
                    body: `Übungsleitungs-PIN: ${trainerKey}`,
                });
                window
                    .open(
                        `${location.origin}/exercises/${trainerKey}`,
                        '_blank'
                    )
                    ?.focus();
            }
        );
    }

    ngOnDestroy() {
        this.stopReplay();
    }
}
