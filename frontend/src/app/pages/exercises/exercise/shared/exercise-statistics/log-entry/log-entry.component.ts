import { Component, inject, input } from '@angular/core';
import { LogEntry } from 'fuesim-digital-shared';
import { StatisticsTimeSelectionService } from '../statistics-time-selection.service';

@Component({
    selector: 'app-log-entry',
    templateUrl: './log-entry.component.html',
    styleUrls: ['./log-entry.component.scss'],
    standalone: false,
})
export class LogEntryComponent {
    private readonly statisticsTimeSelectionService = inject(
        StatisticsTimeSelectionService
    );

    readonly logEntry = input.required<LogEntry>();

    selectTime() {
        this.statisticsTimeSelectionService.selectTime(
            this.logEntry().timestamp,
            'log'
        );
    }
}
