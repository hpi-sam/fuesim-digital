import { Component } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import {
    BaseNodeComponent,
    VisuallyJsModule,
} from '@visuallyjs/browser-ui-angular';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-timeline-node',
    imports: [VisuallyJsModule, NgbTooltip],
    templateUrl: './timeline-node.component.html',
    styleUrl: './timeline-node.component.scss',
})
export class TimelineNodeComponent extends BaseNodeComponent {}
