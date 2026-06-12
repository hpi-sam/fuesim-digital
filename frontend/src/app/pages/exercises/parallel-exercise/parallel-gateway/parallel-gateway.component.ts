import { Component } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import {
    BaseNodeComponent,
    VisuallyJsModule,
} from '@visuallyjs/browser-ui-angular';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-parallel-gateway',
    imports: [VisuallyJsModule, NgbTooltip],
    templateUrl: './parallel-gateway.component.html',
    styleUrl: './parallel-gateway.component.scss',
})
export class ParallelGatewayComponent extends BaseNodeComponent {}
