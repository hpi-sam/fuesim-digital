import { VersionedElementContent } from 'fuesim-digital-shared';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../base-versioned-element-submodal';
import { Component, input, output } from '@angular/core';
import { VehicleTemplateFormMarketplaceComponent } from '../vehicle-template-form/vehicle-template-form.component';
import { AlarmgroupElementModalComponent } from '../alarmgroup-element-modal/alarmgroup-element-modal.component';

@Component({
    selector: 'app-versioned-element-form',
    templateUrl: './versioned-element-form.component.html',
    styleUrl: './versioned-element-form.component.scss',
    imports: [
        VehicleTemplateFormMarketplaceComponent,
        AlarmgroupElementModalComponent,
    ],
})
export class VersionedElementFormComponent
    implements BaseVersionedElementSubmodal<any>
{
    public readonly data = input.required<VersionedElementModalData<any>>();
    public btnText = input.required<string>();
    public disabled = input<boolean>(false);

    public readonly dataSubmit = output<any>();
}
