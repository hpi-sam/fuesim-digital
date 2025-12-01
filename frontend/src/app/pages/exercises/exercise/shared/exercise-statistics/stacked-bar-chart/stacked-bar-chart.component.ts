import type { AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { Component, ElementRef, Input, NgZone, ViewChild } from '@angular/core';
import type { SimpleChangesGeneric } from 'src/app/shared/types/simple-changes-generic';
import { Subject, takeUntil } from 'rxjs';
import { StatisticsTimeSelectionService } from '../statistics-time-selection.service';
import type { StackedBarChartDatasets } from './time-line-area-chart';
import { StackedBarChart } from './time-line-area-chart';

@Component({
    selector: 'app-stacked-bar-chart',
    templateUrl: './stacked-bar-chart.component.html',
    styleUrls: ['./stacked-bar-chart.component.scss'],
    standalone: false,
})
export class StackedBarChartComponent
    implements AfterViewInit, OnChanges, OnDestroy
{
    @Input() statistics!: StackedBarChartStatistics;

    @ViewChild('chart', { static: true })
    chartCanvas!: ElementRef<HTMLCanvasElement>;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly ngZone: NgZone,
        private readonly timeSelectionService: StatisticsTimeSelectionService
    ) {}

    private chart?: StackedBarChart;

    ngAfterViewInit() {
        // Run outside angular zone for improved performance
        this.ngZone.runOutsideAngular(() => {
            this.chart = new StackedBarChart(
                this.chartCanvas.nativeElement,
                (time) => this.timeSelectionService.selectTime(time, 'chart')
            );
            this.timeSelectionService.selectedTime$
                .pipe(takeUntil(this.destroy$))
                .subscribe((update) =>
                    this.chart?.setHighlightTime(update?.time)
                );
        });
        this.updateChartData();
    }

    ngOnChanges(changes: SimpleChangesGeneric<this>) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (changes.statistics) {
            this.updateChartData();
        }
    }

    private updateChartData() {
        this.ngZone.runOutsideAngular(() => {
            this.chart?.setChartData(
                this.statistics.labels,
                this.statistics.datasets
            );
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.chart?.destroy();
    }
}

export interface StackedBarChartStatistics {
    labels: number[];
    datasets: StackedBarChartDatasets;
}
