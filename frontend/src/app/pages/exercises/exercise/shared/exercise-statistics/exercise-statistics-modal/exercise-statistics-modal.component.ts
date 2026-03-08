import type { OnInit } from '@angular/core';
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { PatientStatus, UUID, LogEntry } from 'fuesim-digital-shared';
import { statusNames } from 'fuesim-digital-shared';
import { combineLatest, Observable, map } from 'rxjs';
import { StatisticsService } from '../../core/statistics/statistics.service';
import { AreaStatisticsService } from '../area-statistics.service';
import type { StackedBarChartStatistics } from '../stacked-bar-chart/stacked-bar-chart.component';
import { StackedBarChart } from '../stacked-bar-chart/time-line-area-chart';
import { getRgbaColor } from '../../../../../../shared/functions/colors';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectViewports,
    selectSimulatedRegions,
    selectVehicleTemplates,
    selectPersonnelTemplates,
} from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-exercise-statistics-modal',
    templateUrl: './exercise-statistics-modal.component.html',
    styleUrls: ['./exercise-statistics-modal.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class ExerciseStatisticsModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);
    readonly statisticsService = inject(StatisticsService);
    readonly areaStatisticsService = inject(AreaStatisticsService);

    public viewportIds$!: Observable<UUID[]>;
    public simulatedRegionIds$!: Observable<UUID[]>;

    constructor() {
        this.statisticsService.updateStatistics();
    }
    ngOnInit(): void {
        this.viewportIds$ = this.store
            .select(selectViewports)
            .pipe(map(Object.keys));
        this.simulatedRegionIds$ = this.store
            .select(selectSimulatedRegions)
            .pipe(map(Object.keys));
    }

    public close() {
        this.activeModal.close();
    }

    // Patient statistics
    private readonly patientColors: {
        [key in PatientStatus]: string;
    } = {
        // The order is important (the first key is at the bottom of the chart)
        // The colors are taken from bootstrap
        black: getRgbaColor('black', StackedBarChart.backgroundAlpha),
        blue: getRgbaColor('blue', StackedBarChart.backgroundAlpha),
        red: getRgbaColor('red', StackedBarChart.backgroundAlpha),
        yellow: getRgbaColor('yellow', StackedBarChart.backgroundAlpha),
        green: getRgbaColor('green', StackedBarChart.backgroundAlpha),
        white: getRgbaColor('white', StackedBarChart.backgroundAlpha),
    };

    public patientsStatistics$: Observable<StackedBarChartStatistics> =
        this.areaStatisticsService.areaStatistics$.pipe(
            map((statistics) => ({
                datasets: Object.entries(this.patientColors).map(
                    ([status, backgroundColor]) => ({
                        label: statusNames[status as PatientStatus],
                        data: statistics.map(
                            (statisticEntry) =>
                                statisticEntry.value.patients[
                                    status as PatientStatus
                                ] ?? null
                        ),
                        backgroundColor,
                    })
                ),
                labels: statistics.map(({ exerciseTime }) => exerciseTime),
            }))
        );

    public vehiclesStatistics$: Observable<StackedBarChartStatistics> =
        combineLatest([
            this.areaStatisticsService.areaStatistics$,
            this.store.select(selectVehicleTemplates),
        ]).pipe(
            map(([statistics, vehicleTemplates]) => {
                const vehicleTemplateIds = new Set<UUID>(
                    statistics.flatMap((statistic) =>
                        Object.keys(statistic.value.vehicles)
                    )
                );

                return {
                    datasets: [...vehicleTemplateIds].map((templateId) => ({
                        label:
                            vehicleTemplates[templateId]?.vehicleType ??
                            'unbekannt',
                        data: statistics.map(
                            (statisticEntry) =>
                                statisticEntry.value.vehicles[templateId] ??
                                null
                        ),
                    })),
                    labels: statistics.map(({ exerciseTime }) => exerciseTime),
                };
            })
        );

    public personnelStatistics$: Observable<StackedBarChartStatistics> =
        combineLatest([
            this.areaStatisticsService.areaStatistics$,
            this.store.select(selectPersonnelTemplates),
        ]).pipe(
            map(([statistics, personnelTemplates]) => {
                const personnelTemplateIds = new Set<UUID>(
                    statistics.flatMap((statistic) =>
                        Object.keys(statistic.value.personnel)
                    )
                );

                return {
                    datasets: [...personnelTemplateIds].map((templateId) => ({
                        label:
                            personnelTemplates[templateId]?.name ?? 'unbekannt',
                        data: statistics.map(
                            (statisticEntry) =>
                                statisticEntry.value.personnel[templateId] ??
                                null
                        ),
                    })),
                    labels: statistics.map(({ exerciseTime }) => exerciseTime),
                };
            })
        );

    public logEntries$: Observable<readonly LogEntry[]> =
        this.statisticsService.logEntries$;
}
