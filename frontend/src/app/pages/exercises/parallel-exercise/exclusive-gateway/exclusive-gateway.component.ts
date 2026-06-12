import { Component } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import {
    BaseNodeComponent,
    VisuallyJsModule,
} from '@visuallyjs/browser-ui-angular';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-exclusive-gateway',
    imports: [VisuallyJsModule, NgbTooltip],
    templateUrl: './exclusive-gateway.component.html',
    styleUrl: './exclusive-gateway.component.scss',
})
export class ExclusiveGatewayComponent extends BaseNodeComponent {}
