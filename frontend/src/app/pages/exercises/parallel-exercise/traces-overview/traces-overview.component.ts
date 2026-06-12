import {
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
    viewChild,
} from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import { ParallelTracesCluster, ParticipantKey } from 'fuesim-digital-shared';
import {
    SurfaceComponent,
    VisuallyJsModule,
} from '@visuallyjs/browser-ui-angular';
import {
    EdgeRoutingPlugin,
    HierarchyLayout,
    PanButtonsPlugin,
} from '@visuallyjs/browser-ui';
import { TimeActivityNodeComponent } from '../time-activity-node/time-activity-node.component.js';
import { SingleTimeActivityNodeComponent } from '../single-time-activity-node/single-time-activity-node.component.js';
import { rgbColorPalette } from '../../../../shared/functions/colors.js';
import { LogicalActivityNodeComponent } from '../logical-activity-node/logical-activity-node.component.js';
import { SingleLogicalActivityNodeComponent } from '../single-logical-activity-node/single-logical-activity-node.component.js';
import { ParallelExerciseService } from '../../../../core/parallel-exercise.service.js';
import { ParallelGatewayComponent } from '../parallel-gateway/parallel-gateway.component.js';
import { ExclusiveGatewayComponent } from '../exclusive-gateway/exclusive-gateway.component.js';
import { TimelineNodeComponent } from '../timeline-node/timeline-node.component.js';

interface BaseNode {
    id: string;
    type: '';
}
@Component({
    selector: 'app-traces-overview',
    imports: [VisuallyJsModule],
    templateUrl: './traces-overview.component.html',
    styleUrl: './traces-overview.component.scss',
})
export class TracesOverviewComponent {
    timeActivityNodeHeight = 30;
    timeActivityNodeSpacing = 5;
    logicalActivityNodeHeight = 50;
    logicalActivityNodeWidth = 150;
    logicalSingleActivitySize = 13;

    public readonly parallelExerciseService = inject(ParallelExerciseService);

    viewOptionsTime = {
        nodes: {
            timeActivity: {
                component: TimeActivityNodeComponent,
            },
            singleTimeActivity: {
                component: SingleTimeActivityNodeComponent,
            },
            timeline: {
                component: TimelineNodeComponent,
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
            singleLogicalActivity: {
                component: SingleLogicalActivityNodeComponent,
            },
            parallelGateway: {
                component: ParallelGatewayComponent,
            },
            exclusiveGateway: {
                component: ExclusiveGatewayComponent,
            },
        },
        groups: {
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
                generateRouting: true,
            },
        },
        plugins: [
            PanButtonsPlugin.type,
            {
                type: EdgeRoutingPlugin.type,
                options: {
                    mode: 'orthogonal',
                },
            },
        ],
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

    readonly highlightedParticipantKey = signal<ParticipantKey | null>(null);

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
                    30 +
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
                    label: this.getParticipantLabel(occurrence.participantKey),
                    left:
                        occurrence.startTime === occurrence.endTime
                            ? this.mapWidth(occurrence.startTime) -
                              this.timeActivityNodeHeight / 3 / 2
                            : this.mapWidth(occurrence.startTime),
                    top:
                        30 +
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
                    color: this.getParticipantKeyColor(
                        occurrence.participantKey
                    ),
                    participantKey: occurrence.participantKey,
                    highlighted: true,
                    dot: occurrence.startTime === occurrence.endTime,
                }))
            )
    );
    readonly timelineNodes = computed(() => {
        const nodes = [];
        for (
            let i = this.cluster().minTime;
            i <= this.cluster().maxTime;
            i += 10000
        ) {
            const isMinute = i % 60000 === 0;
            nodes.push({
                id: `time-${i}`,
                type: 'timeline',
                label: isMinute ? `${i / 60000}:00` : undefined,
                width: isMinute ? 3 : 1,
                height: isMinute ? 15 : 10,
                left: this.mapWidth(i),
                top: 0,
            });
        }
        return nodes;
    });
    readonly dataTime = computed(() => ({
        nodes: [
            ...this.timeActivityNodes(),
            ...this.singleTimeActivityNodes(),
            ...this.timelineNodes(),
        ],
        groups: [],
    }));

    readonly logicalActivityNodes = computed(() =>
        Object.values(this.cluster().activities).map((activity, idx) => ({
            type: 'logicalActivity',
            id: activity.id,
            label: activity.verboseName,
            width: this.logicalActivityNodeWidth,
            height: this.logicalActivityNodeHeight,
        }))
    );
    readonly singleLogicalActivityNodes = computed(() =>
        Object.values(this.cluster().activities)
            .sort((a, b) => a.minTime - b.minTime)
            .flatMap((activity, idx) => {
                const leftOffset =
                    (this.logicalActivityNodeWidth -
                        (activity.occurrences.length *
                            this.logicalSingleActivitySize *
                            2 -
                            this.logicalSingleActivitySize)) /
                    2;

                return activity.occurrences.map((occurrence, occrIdx) => ({
                    type: 'singleLogicalActivity',
                    id: `${activity.id}-${occurrence.participantKey}-${occurrence.actionIndex}`,
                    group: activity.id,
                    label: this.getParticipantLabel(occurrence.participantKey),
                    left:
                        leftOffset +
                        occrIdx * this.logicalSingleActivitySize * 2,
                    top: (this.logicalActivityNodeHeight / 3) * 2,
                    width: this.logicalSingleActivitySize,
                    height: this.logicalSingleActivitySize,
                    color: this.getParticipantKeyColor(
                        occurrence.participantKey
                    ),
                    participantKey: occurrence.participantKey,
                    highlighted: true,
                }));
            })
    );
    readonly dataLogical = computed(() => ({
        nodes: [
            ...this.singleLogicalActivityNodes(),
            ...Object.values(this.cluster().gateways).map((gateway) =>
                gateway.type === 'ParallelGateway'
                    ? {
                          id: gateway.id,
                          type: 'parallelGateway',
                          width: 10,
                          height: 60,
                      }
                    : {
                          id: gateway.id,
                          type: 'exclusiveGateway',
                          width: 25,
                          height: 25,
                      }
            ),
        ],
        groups: this.logicalActivityNodes(),
        edges: this.cluster().arcs.map((arc) => ({
            source: arc.source,
            target: arc.target,
            anchors: {
                source: 'Right',
                target: 'Left',
            },
        })),
    }));

    constructor() {
        effect(() => {
            this.highlightedParticipantKey();
            const timeModel = this.timeModel;
            const logicalModel = this.logicalModel;
            if (!timeModel || !logicalModel) return;

            for (const node of timeModel.getNodes()) {
                if (node.type !== 'singleTimeActivity') continue;
                timeModel.updateNode(node.id, {
                    highlighted:
                        this.highlightedParticipantKey() === null ||
                        this.highlightedParticipantKey() ===
                            (node.data['participantKey'] as ParticipantKey),
                });
            }
            for (const node of logicalModel.getNodes()) {
                if (node.type !== 'singleLogicalActivity') continue;
                logicalModel.updateNode(node.id, {
                    highlighted:
                        this.highlightedParticipantKey() === null ||
                        this.highlightedParticipantKey() ===
                            (node.data['participantKey'] as ParticipantKey),
                });
            }
        });
    }

    readonly timeSurface = viewChild<SurfaceComponent>('timeSurface');
    readonly logicalSurface = viewChild<SurfaceComponent>('logicalSurface');

    get timeModel() {
        const surface = this.timeSurface();
        if (!surface?.surface) return undefined;
        return surface.surface.model;
    }
    get logicalModel() {
        const surface = this.logicalSurface();
        if (!surface?.surface) return undefined;
        return surface.surface.model;
    }

    mapWidth(width: number) {
        const factor =
            (this.baseDimensions().width - 80) / this.cluster().maxTime;
        return factor * width;
    }

    getParticipantKeyColor(key: ParticipantKey) {
        return this.colorByParticipantKey()[key]!;
    }

    getParticipantLabel(key: ParticipantKey) {
        const name = this.parallelExerciseService.participantNames()[key];
        if (name) return name;
        return key;
    }
}
