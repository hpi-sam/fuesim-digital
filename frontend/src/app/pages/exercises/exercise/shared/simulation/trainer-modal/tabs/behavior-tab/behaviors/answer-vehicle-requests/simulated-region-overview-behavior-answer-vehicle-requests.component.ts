import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HelpButtonComponent } from '../../../../../../../../../../help-button/help-button.component';

@Component({
    selector: 'app-simulated-region-overview-behavior-answer-vehicle-requests',
    templateUrl:
        './simulated-region-overview-behavior-answer-vehicle-requests.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: [
        './simulated-region-overview-behavior-answer-vehicle-requests.component.scss',
    ],
    imports: [HelpButtonComponent],
})
export class SimulatedRegionOverviewBehaviorAnswerVehicleRequestsComponent {}
