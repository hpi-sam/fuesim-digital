import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlarmGroupVehicle, VehicleTemplate } from 'fuesim-digital-shared';
import { VehicleTemplateDisplayComponent } from '../vehicle-template-display/vehicle-template-display.component';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';

@Component({
    selector: 'app-alarm-group-vehicle-item',
    templateUrl: './alarm-group-vehicle-item.component.html',
    styleUrl: './alarm-group-vehicle-item.component.scss',
    imports: [
        VehicleTemplateDisplayComponent,
        FormsModule,
        AppSaveOnTypingDirective,
    ],
})
export class AlarmGroupVehicleItemComponent {
    public readonly disabled = input(false);

    public readonly alarmGroupVehicle = input.required<AlarmGroupVehicle>();
    public readonly vehicleTemplate = input.required<VehicleTemplate>();

    public readonly editName = output<{
        vehicle: AlarmGroupVehicle;
        event: any;
    }>();
    public readonly editTime = output<{
        vehicle: AlarmGroupVehicle;
        event: any;
    }>();
    public readonly remove = output<AlarmGroupVehicle>();
}
