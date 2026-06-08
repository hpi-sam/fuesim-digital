import { Component } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import {
    BaseNodeComponent,
    VisuallyJsModule,
} from '@visuallyjs/browser-ui-angular';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-single-time-activity-node',
    imports: [VisuallyJsModule, NgbTooltip],
    templateUrl: './single-time-activity-node.component.html',
    styleUrl: './single-time-activity-node.component.scss',
})
export class SingleTimeActivityNodeComponent extends BaseNodeComponent {}
