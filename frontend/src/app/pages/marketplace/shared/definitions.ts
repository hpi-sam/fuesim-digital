import type { MarketplaceElementContent } from 'fuesim-digital-shared';
import { MapImageTemplateFormComponent } from './modals/editor-modals/element-forms/map-image-template-form/map-image-template-form.component';
import { MaterialTemplateFormComponent } from './modals/editor-modals/element-forms/material-template-form/material-template-form.component';
import { PersonnelTemplateFormComponent } from './modals/editor-modals/element-forms/personnel-template-form/personnel-template-form.component';
import { VehicleTemplateFormMarketplaceComponent } from './modals/editor-modals/element-forms/vehicle-template-form/vehicle-template-form.component';
import { AlarmGroupFormComponent } from './modals/editor-modals/element-forms/alarm-group-form/alarm-group-form.component.js';

interface MarketplaceItemDefintition<C extends MarketplaceElementContent> {
    elementFormComponent: any;
    helpUrl?: string;
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
        elementFormComponent: AlarmGroupFormComponent,
        helpUrl: '2_exercises/3_exercise_elements.html#alarmgruppen',
        elementCard: (content) => ({
            title: content.name,
            subtitle: `${Object.values(content.alarmGroupVehicles).length} Fahrzeuge`,
        }),
    },
    mapImageTemplate: {
        elementFormComponent: MapImageTemplateFormComponent,
        helpUrl: '2_exercises/3_exercise_elements.html#bilder',
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
        helpUrl:
            '2_exercises/3_exercise_elements.html#fahrzeuge-mit-personal-und-material',
        elementCard: (content) => ({
            title: content.vehicleType,
            subtitle: content.name,
            image: content.image.url,
        }),
    },
};
