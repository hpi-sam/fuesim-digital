import { Component, computed, input } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import { ParallelTracesCluster } from 'fuesim-digital-shared';
import { VisuallyJsModule } from '@visuallyjs/browser-ui-angular';
import { ForceDirectedLayout } from '@visuallyjs/browser-ui';

interface OurNode {
    id: string;
    label?: string;
    top?: number;
    left?: number;
    width?: number;
    height?: number;
}

@Component({
    selector: 'app-traces-overview',
    imports: [VisuallyJsModule],
    templateUrl: './traces-overview.component.html',
    styleUrl: './traces-overview.component.scss',
})
export class TracesOverviewComponent {
    readonly baseDimensions = input.required<{
        width: number;
        height: number;
    }>();
    readonly renderOptions = computed(() => ({
        useModelForSizes: true,
        elementsDraggable: false,
        layout: {
            type: ForceDirectedLayout.type,
            options: {
                spacing: 20,
                absoluteBacked: true,
                iterations: 100,
                r: 0.1,
            },
        },
        edges: {
            targetMarker: 'PlainArrow',
            connector: 'Orthogonal',
            overlays: [],
        },
    }));
    readonly cluster = input.required<ParallelTracesCluster>();
    readonly activityNodes = computed(() =>
        Object.values(this.cluster().activities)
            .sort((a, b) => a.minTime - b.minTime)
            .map((activity, idx) => ({
                id: activity.id,
                label: activity.name,
                left: this.mapWidth(activity.minTime),
                top: idx * 80,
                width: this.mapWidth(activity.maxTime - activity.minTime),
                height: 30,
            }))
    );
    readonly nodes = computed(() => [
        ...this.activityNodes(),
        ...Object.values(this.cluster().gateways).map(
            (gateway) =>
                ({
                    id: gateway.id,
                    label: gateway.type.slice(0, 1),
                    // left: activity.minTime,
                    // top: idx * 50,
                    width: 20,
                    height: 20,
                }) satisfies OurNode
        ),
    ]);
    readonly data = computed(() => ({
        nodes: this.nodes(),
        groups: [],
        // edges: this.cluster().arcs.map((arc) => ({
        //     source: arc.source,
        //     target: arc.target,
        //     anchors: {
        //         source: 'Right',
        //         target: 'Left',
        //     },
        // })),
    }));

    mapWidth(width: number) {
        const factor = this.baseDimensions().width / this.cluster().maxTime;
        console.log(
            factor,
            width,
            this.baseDimensions().width,
            this.cluster().maxTime
        );
        return factor * width;
    }
}
