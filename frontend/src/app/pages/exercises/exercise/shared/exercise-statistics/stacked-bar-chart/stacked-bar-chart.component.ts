import type { AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import {
    Component,
    ElementRef,
    NgZone,
    inject,
    input,
    viewChild,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { StatisticsTimeSelectionService } from '../statistics-time-selection.service';
import type { SimpleChangesGeneric } from '../../../../../../shared/types/simple-changes-generic';
import type { StackedBarChartDatasets } from './time-line-area-chart';
import { StackedBarChart } from './time-line-area-chart';

@Component({
    selector: 'app-stacked-bar-chart',
    templateUrl: './stacked-bar-chart.component.html',
    styleUrls: ['./stacked-bar-chart.component.scss'],
})
export class StackedBarChartComponent
    implements AfterViewInit, OnChanges, OnDestroy
{
    private readonly ngZone = inject(NgZone);
    private readonly timeSelectionService = inject(
        StatisticsTimeSelectionService
    );

    readonly statistics = input.required<StackedBarChartStatistics>();

    readonly chartCanvas =
        viewChild.required<ElementRef<HTMLCanvasElement>>('chart');

    private readonly destroy$ = new Subject<void>();

    private chart?: StackedBarChart;

    ngAfterViewInit() {
        // Run outside angular zone for improved performance
        this.ngZone.runOutsideAngular(() => {
            this.chart = new StackedBarChart(
                this.chartCanvas().nativeElement,
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
                this.statistics().labels,
                this.statistics().datasets
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
