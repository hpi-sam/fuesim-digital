import { uuid, type UUID } from 'fuesim-digital-shared';
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer.js';
import type EventBus from 'diagram-js/lib/core/EventBus.js';

interface Point {
    x: number;
    y: number;
}

interface StateShape {
    id: UUID;
    type: 'stateShape';
    x: number;
    y: number;
    width: number;
    height: number;
}
interface TransitionShape {
    id: UUID;
    type: 'transitionShape';
    source: StateShape;
    target: StateShape;
    waypoints: Point[];
}

class StateMachineElementFactory {
    createState(attrs: Partial<StateShape> = {}): StateShape {
        return {
            height: 0,
            id: uuid(),
            type: 'stateShape',
            width: 0,
            x: 0,
            y: 0,
            ...attrs,
        };
    }
    createTransition(
        attrs: Partial<TransitionShape> &
            Pick<TransitionShape, 'source' | 'target'>
    ): TransitionShape {
        return {
            id: uuid(),
            type: 'transitionShape',
            waypoints: [],
            ...attrs,
        };
    }
}

class StateMachineRenderer extends BaseRenderer {
    static $inject = ['eventBus'] as const;

    constructor(eventBus: EventBus) {
        super(eventBus, 1000);
    }

    override canRender(element: any): element is StateShape | TransitionShape {
        return (
            element.type === 'stateShape' || element.type === 'transitionShape'
        );
    }

    override drawShape(parent: SVGElement, shape: StateShape): SVGElement {
        const circle = svgCreate('circle') as SVGCircleElement;
        svgAppend(parent, circle);

        circle.setAttribute('cx', String(shape.width / 2));
        circle.setAttribute('cy', String(shape.height / 2));
        circle.setAttribute(
            'r',
            String(Math.min(shape.width, shape.height) / 2)
        );
        circle.setAttribute('fill', '#fff');
        circle.setAttribute('stroke', '#333');

        return circle;
    }

    override drawConnection(
        parent: SVGElement,
        connection: TransitionShape
    ): SVGElement {
        const path = svgCreate('path') as SVGPathElement;
        svgAppend(parent, path);

        const d = connection.waypoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');

        path.setAttribute('d', d);
        path.setAttribute('stroke', '#333');
        path.setAttribute('fill', 'none');

        return path;
    }
}

export const StateMachineModule = {
    __init__: ['stateMachineRenderer'],
    stateMachineRenderer: ['type', StateMachineRenderer],
    stateMachineElementFactory: ['type', StateMachineElementFactory],
};
