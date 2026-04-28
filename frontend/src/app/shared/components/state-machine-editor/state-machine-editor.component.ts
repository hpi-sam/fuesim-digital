import {
    afterNextRender,
    Component,
    model,
    type OnDestroy,
    viewChild,
} from '@angular/core';
import type { TechnicalChallengeStateMachine } from 'fuesim-digital-shared';
import Diagram from 'diagram-js';
import type DefaultRenderer from 'diagram-js/lib/draw/DefaultRenderer.js';
import ConnectModule from 'diagram-js/lib/features/connect';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider.js';

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
        viewChild.required<HTMLDivElement>('diagramContainer');

    constructor() {
        afterNextRender(() => {
            const elementsStyleModule = {
                __init__: [
                    'defaultRenderer',
                    function (defaultRenderer: DefaultRenderer) {
                        defaultRenderer.CONNECTION_STYLE = {
                            fill: 'none',
                            strokeWidth: 5,
                            stroke: '#000',
                        };
                        defaultRenderer.SHAPE_STYLE = {};
                        defaultRenderer.FRAME_STYLE = {};
                    },
                ],
            };

            class ExampleRuleProvider extends RuleProvider {
                override init() {
                    super.init();
                    this.addRule('shape.create', (context) => {
                        const { target, shape } = context;
                        return target.parent === shape.parent;
                    });
                }
            }

            const providerModule = {
                __init__: ['examplePaletteProvider'],
                examplePaletteProvider: [],
            };

            const builtInModules = [ConnectModule];

            this.diagram = new Diagram({
                canvas: this.diagramContainer(),
                modules: [...builtInModules, elementsStyleModule],
            });
        });
    }

    ngOnDestroy() {
        this.diagram?.destroy();
    }
}
