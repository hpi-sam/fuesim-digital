import { Component, input, output } from '@angular/core';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../base-versioned-element-submodal';
import { VehicleTemplateFormMarketplaceComponent } from '../element-forms/vehicle-template-form/vehicle-template-form.component';
import { AlarmgroupFormComponent } from '../element-forms/alarmgroup-form/alarmgroup-form.component';

@Component({
    selector: 'app-versioned-element-form',
    templateUrl: './versioned-element-form.component.html',
    styleUrl: './versioned-element-form.component.scss',
    imports: [VehicleTemplateFormMarketplaceComponent, AlarmgroupFormComponent],
})
export class VersionedElementFormComponent implements BaseVersionedElementSubmodal<any> {
    public readonly data = input.required<VersionedElementModalData<any>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<any>();
}
