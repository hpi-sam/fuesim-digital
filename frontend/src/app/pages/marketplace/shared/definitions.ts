import type { MarketplaceElementContent } from 'fuesim-digital-shared';
import { AlarmgroupFormComponent } from './modals/editor-modals/element-forms/alarmgroup-form/alarmgroup-form.component';
import { MapImageTemplateFormComponent } from './modals/editor-modals/element-forms/map-image-template-form/map-image-template-form.component';
import { MaterialTemplateFormComponent } from './modals/editor-modals/element-forms/material-template-form/material-template-form.component';
import { PersonnelTemplateFormComponent } from './modals/editor-modals/element-forms/personnel-template-form/personnel-template-form.component';
import { VehicleTemplateFormMarketplaceComponent } from './modals/editor-modals/element-forms/vehicle-template-form/vehicle-template-form.component';

interface MarketplaceItemDefintition<C extends MarketplaceElementContent> {
    elementFormComponent: any;
    elementCard: (content: C) => {
        title: string;
        subtitle?: string;
        image?: string;
    };
}

export const marketplaceComponentDefinitions: {
    [key in MarketplaceElementContent['type']]: MarketplaceItemDefintition<
        Extract<MarketplaceElementContent, { type: key }>
    >;
} = {
    alarmGroup: {
        elementFormComponent: AlarmgroupFormComponent,
        elementCard: (content) => ({
            title: content.name,
            subtitle: `${Object.values(content.alarmGroupVehicles).length} Fahrzeuge`,
        }),
    },
    mapImageTemplate: {
        elementFormComponent: MapImageTemplateFormComponent,
        elementCard: (content) => ({
            title: content.name,
            image: content.image.url,
        }),
    },
    materialTemplate: {
        elementFormComponent: MaterialTemplateFormComponent,
        elementCard: (content) => ({
            title: content.name,
            image: content.image.url,
        }),
    },
    personnelTemplate: {
        elementFormComponent: PersonnelTemplateFormComponent,
        elementCard: (content) => ({
            title: content.name,
            subtitle: content.personnelType,
            image: content.image.url,
        }),
    },
    vehicleTemplate: {
        elementFormComponent: VehicleTemplateFormMarketplaceComponent,
        elementCard: (content) => ({
            title: content.vehicleType,
            subtitle: content.name,
            image: content.image.url,
        }),
    },
};
