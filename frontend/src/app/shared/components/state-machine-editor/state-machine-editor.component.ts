import {
    afterNextRender,
    Component,
    type ElementRef,
    model,
    type OnDestroy,
    viewChild,
} from '@angular/core';
import type { TechnicalChallengeStateMachine } from 'fuesim-digital-shared';
import Diagram from 'diagram-js';
import type ElementFactory from 'diagram-js/lib/core/ElementFactory.js';
import type Canvas from 'diagram-js/lib/core/Canvas.js';
import {
    StateMachineElementFactory,
    StateMachineModule,
} from './state-machine-diagram-module.js';

@Component({
    selector: 'app-state-machine-editor',
    imports: [],
    templateUrl: './state-machine-editor.component.html',
    styleUrl: './state-machine-editor.component.scss',
})
export class StateMachineEditorComponent implements OnDestroy {
    public readonly stateMachine =
        model.required<TechnicalChallengeStateMachine>();

    private diagram?: Diagram;
    private readonly diagramContainer =
        viewChild.required<ElementRef<HTMLDivElement>>('diagramContainer');

    constructor() {
        afterNextRender(() => {
            console.log(this.diagramContainer());
            this.diagram = new Diagram({
                canvas: { container: this.diagramContainer().nativeElement },
                modules: [StateMachineModule],
            });

            const canvas: Canvas = this.diagram.get('canvas');
            console.log(canvas);
            const factory: StateMachineElementFactory = this.diagram.get(
                'stateMachineElementFactory'
            );
            const rootFactory: ElementFactory =
                this.diagram.get('elementFactory');
            const root = rootFactory.createRoot();
            canvas.setRootElement(root);
            const shape = factory.createState({
                x: 0,
                y: 0,
                width: 100,
                height: 100,
            });
            console.log('test');
            canvas.addShape(shape, root);
            console.log('test2');
        });
    }

    ngOnDestroy() {
        this.diagram?.destroy();
    }
}
