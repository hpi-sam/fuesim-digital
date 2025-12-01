import type { ChartConfiguration, ChartDataset } from 'chart.js';
import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    Legend,
    LinearScale,
    Tooltip,
} from 'chart.js';
import { formatDuration } from 'digital-fuesim-manv-shared';
import { rgbColorPalette } from 'src/app/shared/functions/colors';

Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Tooltip,
    Legend
);

type Data = number | null;

export type StackedBarChartDatasets = ChartDataset<'bar', Data[]>[];

export class StackedBarChart {
    public static readonly backgroundAlpha = 0.8;
    public readonly chart: Chart<'bar', Data[], number>;
    markedTime: number | undefined;
    lineMarkerIndex: number | undefined;

    constructor(
        canvas: HTMLCanvasElement,
        readonly clickCallback?: (time: number) => void
    ) {
        this.chart = new Chart(canvas, this.canvasConfig);
    }

    public setHighlightTime(time: number | undefined) {
        this.markedTime = time;
        this.updateMarkerIndex();
        this.chart.update();
    }

    private updateMarkerIndex() {
        if (this.markedTime === undefined) {
            this.lineMarkerIndex = undefined;
        } else {
            const index =
                this.chart.data.labels?.findIndex(
                    (label) => this.markedTime! <= label
                ) ?? -1;
            this.lineMarkerIndex = index < 0 ? undefined : index;
        }
    }

    public setChartData(
        newLabels: number[],
        newDatasets: StackedBarChartDatasets
    ) {
        this.chart.data.labels = newLabels;

        // Replacing the current datasets with new ones resets the chart and causes problems https://stackoverflow.com/a/58118273
        // So we mutate the current datasets instead

        // Remove all datasets that are no longer present
        this.chart.data.datasets.splice(newDatasets.length);
        // Add new datasets and update the values of the existing ones
        newDatasets.forEach((newDataset, index) => {
            const oldDataset = this.chart.data.datasets[index];
            if (!oldDataset) {
                this.chart.data.datasets[index] = newDataset;
                return;
            }
            // Remove all properties
            Object.keys(oldDataset).forEach((key) => {
                delete oldDataset[key as keyof ChartDataset];
            });
            // Add the properties from the new dataset
            Object.assign(oldDataset, newDataset);
        });
        this.updateMarkerIndex();
        this.chart.update();
    }

    public destroy() {
        this.chart.destroy();
    }

    // It causes problems if this object is shared between multiple charts.
    private readonly canvasConfig: ChartConfiguration<'bar', Data[], number> = {
        type: 'bar',
        data: {
            labels: [],
            datasets: [],
        },
        options: {
            animation: false,
            plugins: {
                tooltip: {
                    position: 'nearest',
                    mode: 'index',
                    callbacks: {
                        label: (tooltipItem) =>
                            `${tooltipItem.dataset.label}: ${tooltipItem.formattedValue}`,
                        title(tooltipItems) {
                            return formatDuration(
                                Number(tooltipItems[0]!.label)
                            );
                        },
                    },
                },
                legend: {
                    display: true,
                    labels: {
                        color: rgbColorPalette.black,
                    },
                },
                filler: {
                    propagate: false,
                },
            },
            responsive: true,
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    stacked: true,
                    type: 'category',
                    ticks: {
                        maxTicksLimit: 10,
                        callback(tickValue) {
                            return formatDuration(
                                this.chart.data.labels?.[
                                    tickValue as number
                                ] as number
                            );
                        },
                    },
                },
                y: {
                    stacked: 'single',
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        major: {
                            enabled: true,
                        },
                    },
                },
            },
            datasets: {
                bar: {
                    categoryPercentage: 1,
                    barPercentage: 1,
                    // The data must be unique, sorted, and consistent
                    normalized: false,
                },
            },
            onClick: (event, elements, chart) => {
                const {
                    scales: { x },
                    data: { labels },
                } = chart;
                if (event.x === null || !this.clickCallback) return;
                const index = x?.getValueForPixel(event.x);
                if (index !== undefined && labels?.[index] !== undefined) {
                    this.clickCallback(labels[index] as number);
                }
            },
        },
        plugins: [
            {
                id: 'timeMarker',
                afterDraw: (chart) => {
                    if (this.lineMarkerIndex === undefined) return;
                    const {
                        ctx,
                        chartArea: { top, bottom },
                        scales: { x },
                    } = chart;
                    const xCoord = x!.getPixelForValue(this.lineMarkerIndex);

                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = 'blue';
                    ctx.lineWidth = 3;
                    ctx.moveTo(xCoord, top);
                    ctx.lineTo(xCoord, bottom);
                    ctx.stroke();
                    ctx.restore();
                },
            },
        ],
    };
}
