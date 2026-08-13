import {
    Component,
    input,
    output,
    ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlarmGroupVehicle, VehicleTemplate } from 'fuesim-digital-shared';
import { VehicleTemplateDisplayComponent } from '../vehicle-template-display/vehicle-template-display.component';

@Component({
    selector: 'app-alarm-group-vehicle-item',
    templateUrl: './alarm-group-vehicle-item.component.html',
    styleUrl: './alarm-group-vehicle-item.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [VehicleTemplateDisplayComponent, FormsModule],
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
