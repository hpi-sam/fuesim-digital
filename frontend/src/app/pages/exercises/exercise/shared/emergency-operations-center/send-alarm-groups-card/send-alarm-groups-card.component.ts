import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-send-alarm-groups-card',
    templateUrl: './send-alarm-groups-card.component.html',
    styleUrls: ['./send-alarm-groups-card.component.scss'],
    standalone: false,
})
export class SendAlarmGroupsCardComponent {
    @Input()
    public useComplexLayout = false;
}
