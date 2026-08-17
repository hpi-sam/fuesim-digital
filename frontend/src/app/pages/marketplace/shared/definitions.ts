import type {
    MarketplaceElementContent,
    TypedTemplateVersion,
} from 'fuesim-digital-shared';
import { CollectionService } from '../../../core/collection.service';
import { AlarmgroupFormComponent } from './modals/editor-modals/element-forms/alarmgroup-form/alarmgroup-form.component';
import { MapImageTemplateFormComponent } from './modals/editor-modals/element-forms/map-image-template-form/map-image-template-form.component';
import { MaterialTemplateFormComponent } from './modals/editor-modals/element-forms/material-template-form/material-template-form.component';
import { PersonnelTemplateFormComponent } from './modals/editor-modals/element-forms/personnel-template-form/personnel-template-form.component';
import { VehicleTemplateFormMarketplaceComponent } from './modals/editor-modals/element-forms/vehicle-template-form/vehicle-template-form.component';
import { UploadedImageFormComponent } from './modals/editor-modals/element-forms/uploaded-image-form/uploaded-image-form.component.js';

interface MarketplaceItemDefintition<C extends MarketplaceElementContent> {
    elementFormComponent: any;
    helpUrl?: string;
    elementCard: (element: TypedTemplateVersion<C>) => {
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
        helpUrl: '2_exercises/3_exercise_elements.html#alarmgruppen',
        elementCard: (element) => ({
            title: element.content.name,
            subtitle: `${Object.values(element.content.alarmGroupVehicles).length} Fahrzeuge`,
        }),
    },
    mapImageTemplate: {
        elementFormComponent: MapImageTemplateFormComponent,
        helpUrl: '2_exercises/3_exercise_elements.html#bilder',
        elementCard: (element) => ({
            title: element.content.name,
            image: element.content.image.url,
        }),
    },
    uploadedImage: {
        elementFormComponent: UploadedImageFormComponent,
        helpUrl: '2_exercises/3_exercise_elements.html#bilder', // TODO
        elementCard: (element) => ({
            title: element.content.name,
            image: CollectionService.getUploadedImageUrl(element.versionId),
        }),
    },
    materialTemplate: {
        elementFormComponent: MaterialTemplateFormComponent,
        elementCard: (element) => ({
            title: element.content.name,
            image: element.content.image.url,
        }),
    },
    personnelTemplate: {
        elementFormComponent: PersonnelTemplateFormComponent,
        elementCard: (element) => ({
            title: element.content.name,
            subtitle: element.content.personnelType,
            image: element.content.image.url,
        }),
    },
    vehicleTemplate: {
        elementFormComponent: VehicleTemplateFormMarketplaceComponent,
        helpUrl:
            '2_exercises/3_exercise_elements.html#fahrzeuge-mit-personal-und-material',
        elementCard: (element) => ({
            title: element.content.vehicleType,
            subtitle: element.content.name,
            image: element.content.image.url,
        }),
    },
};
