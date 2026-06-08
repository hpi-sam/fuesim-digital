import { Component } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import {
    BaseNodeComponent,
    VisuallyJsModule,
} from '@visuallyjs/browser-ui-angular';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-time-activity-node',
    imports: [VisuallyJsModule, NgbTooltip],
    templateUrl: './time-activity-node.component.html',
    styleUrl: './time-activity-node.component.scss',
})
export class TimeActivityNodeComponent extends BaseNodeComponent {}
