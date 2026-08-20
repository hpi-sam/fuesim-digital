import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HelpButtonComponent } from '../../../../../../../../../../help-button/help-button.component';

@Component({
    selector: 'app-simulated-region-overview-behavior-transfer-to-hospital',
    templateUrl:
        './simulated-region-overview-behavior-transfer-to-hospital.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: [
        './simulated-region-overview-behavior-transfer-to-hospital.component.scss',
    ],
    imports: [HelpButtonComponent],
})
export class SimulatedRegionOverviewBehaviorTransferToHospitalComponent {}
