import { Component, computed, input } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import { ParallelTracesCluster } from 'fuesim-digital-shared';
import { VisuallyJsModule } from '@visuallyjs/browser-ui-angular';
import { HierarchyLayout, PanButtonsPlugin } from '@visuallyjs/browser-ui';
import { TimeActivityNodeComponent } from '../time-activity-node/time-activity-node.component.js';
import { SingleTimeActivityNodeComponent } from '../single-time-activity-node/single-time-activity-node.component.js';
import { rgbColorPalette } from '../../../../shared/functions/colors.js';
import { LogicalActivityNodeComponent } from '../logical-activity-node/logical-activity-node.component.js';

@Component({
    selector: 'app-traces-overview',
    imports: [VisuallyJsModule],
    templateUrl: './traces-overview.component.html',
    styleUrl: './traces-overview.component.scss',
})
export class TracesOverviewComponent {
    timeActivityNodeHeight = 30;
    timeActivityNodeSpacing = 10;

    viewOptionsTime = {
        nodes: {
            timeActivity: {
                component: TimeActivityNodeComponent,
            },
            singleTimeActivity: {
                component: SingleTimeActivityNodeComponent,
            },
        },
    };
    readonly renderOptionsTime = computed(() => ({
        useModelForSizes: true,
        elementsDraggable: false,
        panOptions: {
            enabled: false,
        },
        zoomOptions: {
            range: [1, 1],
        },
    }));

    viewOptionsLogical = {
        nodes: {
            logicalActivity: {
                component: LogicalActivityNodeComponent,
            },
        },
    };
    readonly renderOptionsLogical = computed(() => ({
        useModelForSizes: true,
        elementsDraggable: false,
        layout: {
            type: HierarchyLayout.type,
            options: {
                axis: 'vertical',
            },
        },
        plugins: [PanButtonsPlugin.type],
        edges: {
            targetMarker: 'PlainArrow',
            connector: 'Orthogonal',
            overlays: [],
        },
    }));

    readonly baseDimensions = input.required<{
        width: number;
        height: number;
    }>();
    readonly cluster = input.required<ParallelTracesCluster>();

    readonly colorByParticipantKey = computed(() =>
        Object.fromEntries(
            this.cluster().participantKeys.map((key, idx) => [
                key,
                Object.values(rgbColorPalette)[idx] ?? '#da1f3d',
            ])
        )
    );

    readonly timeActivityNodes = computed(() =>
        Object.values(this.cluster().activities)
            .sort((a, b) => a.minTime - b.minTime)
            .map((activity, idx) => ({
                type: 'timeActivity',
                id: activity.id,
                label: activity.verboseName,
                left: this.mapWidth(activity.minTime),
                top:
                    idx *
                    (this.timeActivityNodeHeight +
                        this.timeActivityNodeSpacing),
                width: this.mapWidth(activity.maxTime - activity.minTime),
                height: this.timeActivityNodeHeight,
            }))
    );
    readonly timeVisHeight = computed(
        () => this.timeActivityNodes().length * 40 + 40
    );
    readonly singleTimeActivityNodes = computed(() =>
        Object.values(this.cluster().activities)
            .sort((a, b) => a.minTime - b.minTime)
            .flatMap((activity, idx) =>
                activity.occurrences.map((occurrence) => ({
                    type: 'singleTimeActivity',
                    id: `${activity.id}-${occurrence.participantKey}-${occurrence.actionIndex}`,
                    label: occurrence.participantKey,
                    left: this.mapWidth(occurrence.startTime),
                    top:
                        idx *
                            (this.timeActivityNodeSpacing +
                                this.timeActivityNodeHeight) +
                        (this.timeActivityNodeHeight / 3) * 2,
                    width: Math.max(
                        this.mapWidth(
                            occurrence.endTime - occurrence.startTime
                        ),
                        this.timeActivityNodeHeight / 3
                    ),
                    height: this.timeActivityNodeHeight / 3,
                    color: this.colorByParticipantKey()[
                        occurrence.participantKey
                    ]!,
                }))
            )
    );
    readonly dataTime = computed(() => ({
        nodes: [...this.timeActivityNodes(), ...this.singleTimeActivityNodes()],
        groups: [],
    }));

    readonly logicalActivityNodes = computed(() =>
        Object.values(this.cluster().activities).map((activity, idx) => ({
            type: 'logicalActivity',
            id: activity.id,
            label: activity.verboseName,
            width: 150,
            height: 50,
        }))
    );
    readonly dataLogical = computed(() => ({
        nodes: [
            ...this.logicalActivityNodes(),
            ...Object.values(this.cluster().gateways).map((gateway) => ({
                id: gateway.id,
                label: gateway.type.slice(0, 1),
                width: 20,
                height: 20,
            })),
        ],
        groups: [],
        edges: this.cluster().arcs.map((arc) => ({
            source: arc.source,
            target: arc.target,
            anchors: {
                source: 'Right',
                target: 'Left',
            },
        })),
    }));

    mapWidth(width: number) {
        const factor =
            (this.baseDimensions().width - 80) / this.cluster().maxTime;
        return factor * width;
    }
}
