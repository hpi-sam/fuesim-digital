import { Component, input, output } from '@angular/core';
import { marketplaceElementsDefinitions } from 'fuesim-digital-shared';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../base-versioned-element-submodal';
import { VehicleTemplateFormMarketplaceComponent } from '../element-forms/vehicle-template-form/vehicle-template-form.component';
import { AlarmgroupFormComponent } from '../element-forms/alarmgroup-form/alarmgroup-form.component';
import { PersonnelTemplateFormComponent } from '../element-forms/personnel-template-form/personnel-template-form.component';
import { MaterialTemplateFormComponent } from '../element-forms/material-template-form/material-template-form.component';
import { MapImageTemplateFormComponent } from '../element-forms/map-image-template-form/map-image-template-form.component';

@Component({
    selector: 'app-versioned-element-form',
    templateUrl: './versioned-element-form.component.html',
    styleUrl: './versioned-element-form.component.scss',
    imports: [
        VehicleTemplateFormMarketplaceComponent,
        AlarmgroupFormComponent,
        PersonnelTemplateFormComponent,
        MaterialTemplateFormComponent,
        MapImageTemplateFormComponent,
    ],
})
export class VersionedElementFormComponent implements BaseVersionedElementSubmodal<any> {
    public readonly data = input.required<VersionedElementModalData<any>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<any>();
    public readonly discardChanges = output();

    public generateButtonText() {
        const type = this.data().type;
        return `${marketplaceElementsDefinitions[type].naming.singular} speichern`;
    }
}
