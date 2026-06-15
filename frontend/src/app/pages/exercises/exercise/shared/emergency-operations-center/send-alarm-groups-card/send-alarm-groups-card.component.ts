import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SendAlarmGroupInterfaceComponent } from '../../../../../../shared/components/send-alarm-group-interface/send-alarm-group-interface.component';
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component.js';

@Component({
    selector: 'app-send-alarm-groups-card',
    templateUrl: './send-alarm-groups-card.component.html',
    styleUrls: ['./send-alarm-groups-card.component.scss'],
    imports: [
        FormsModule,
        SendAlarmGroupInterfaceComponent,
        HelpButtonComponent,
    ],
})
export class SendAlarmGroupsCardComponent {
    public readonly useComplexLayout = model(false);

    setComplexLayout(useComplexLayout: boolean) {
        this.useComplexLayout.set(useComplexLayout);
    }
}
