import { Component, computed, input } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import { ParallelTracesCluster } from 'fuesim-digital-shared';
import { VisuallyJsModule } from '@visuallyjs/browser-ui-angular';
import { ForceDirectedLayout } from '@visuallyjs/browser-ui';
import { TimeActivityNodeComponent } from '../time-activity-node/time-activity-node.component.js';
import { SingleTimeActivityNodeComponent } from '../single-time-activity-node/single-time-activity-node.component.js';
import { rgbColorPalette } from '../../../../shared/functions/colors.js';

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
    viewOptions = {
        nodes: {
            timeActivity: {
                component: TimeActivityNodeComponent,
            },
            singleTimeActivity: {
                component: SingleTimeActivityNodeComponent,
            },
        },
    };
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
    readonly colorByParticipantKey = computed(() =>
        Object.fromEntries(
            this.cluster().participantKeys.map((key, idx) => [
                key,
                Object.values(rgbColorPalette)[idx] ?? '#da1f3d',
            ])
        )
    );
    readonly activityNodes = computed(() =>
        Object.values(this.cluster().activities)
            .sort((a, b) => a.minTime - b.minTime)
            .map((activity, idx) => ({
                type: 'timeActivity',
                id: activity.id,
                label: activity.verboseName,
                left: this.mapWidth(activity.minTime),
                top: idx * 40,
                width: this.mapWidth(activity.maxTime - activity.minTime),
                height: 30,
            }))
    );
    readonly singleActivityNodes = computed(() =>
        Object.values(this.cluster().activities)
            .sort((a, b) => a.minTime - b.minTime)
            .flatMap((activity, idx) =>
                activity.occurrences.map((occurrence) => ({
                    type: 'singleTimeActivity',
                    id: `${activity.id}-${occurrence.participantKey}-${occurrence.actionIndex}`,
                    label: occurrence.participantKey,
                    left: this.mapWidth(occurrence.startTime),
                    top: idx * 40 + 10,
                    width: Math.max(
                        this.mapWidth(
                            occurrence.endTime - occurrence.startTime
                        ),
                        10
                    ),
                    height: 10,
                    color: this.colorByParticipantKey()[
                        occurrence.participantKey
                    ]!,
                }))
            )
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
        nodes: [...this.activityNodes(), ...this.singleActivityNodes()],
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
