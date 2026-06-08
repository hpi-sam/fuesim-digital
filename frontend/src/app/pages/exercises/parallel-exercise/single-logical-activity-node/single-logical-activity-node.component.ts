import { Component } from '@angular/core';
import '@visuallyjs/browser-ui/css/visuallyjs.css';
import {
    BaseNodeComponent,
    VisuallyJsModule,
} from '@visuallyjs/browser-ui-angular';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-single-logical-activity-node',
    imports: [VisuallyJsModule, NgbTooltip],
    templateUrl: './single-logical-activity-node.component.html',
    styleUrl: './single-logical-activity-node.component.scss',
})
export class SingleLogicalActivityNodeComponent extends BaseNodeComponent {}
