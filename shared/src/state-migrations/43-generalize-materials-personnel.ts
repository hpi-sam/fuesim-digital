import type { UUID } from '../utils/index.js';
import { uuid } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

interface ImageProperties {
    url: string;
}
interface VehicleTemplate {
    id: UUID;
    materials?: MaterialType[];
    personnel?: PersonnelType[];
    materialTemplateIds?: UUID[];
    personnelTemplateIds?: UUID[];
}
interface PersonnelTemplate {
    id?: UUID;
    personnelType: PersonnelType;
    name?: string;
    abbreviation?: string;
}
interface Personnel {
    templateId?: UUID;
    personnelType: PersonnelType;
    typeName?: string;
    typeAbbreviation?: string;
}
interface MaterialTemplate {
    id?: UUID;
    materialType?: MaterialType;
    typeName?: string;
}
interface Material {
    templateId?: UUID;
    name?: string;
    image: ImageProperties;
}
interface VehicleParameters {
    materials: Material[];
    personnel: Personnel[];
}
interface MapImageTemplate {
    id: UUID;
}
interface MapImage {
    id?: UUID;
    image: ImageProperties;
}

type MaterialType = 'big' | 'standard';
type PersonnelType = 'gf' | 'notarzt' | 'notSan' | 'rettSan' | 'san';

const materialTypeNames: {
    [key in MaterialType]: string;
} = {
    big: 'Erweitertes Material',
    standard: 'Standardmaterial',
};

const materialTemplateIds: {
    [key in MaterialType]: UUID;
} = {
    big: uuid(),
    standard: uuid(),
};

const personnelTemplateIds: {
    [key in PersonnelType]: UUID;
} = {
    gf: uuid(),
    notarzt: uuid(),
    notSan: uuid(),
    rettSan: uuid(),
    san: uuid(),
};

const personnelTypeAbbreviations: {
    [Key in PersonnelType]: string;
} = {
    gf: 'GF',
    notarzt: 'NA',
    notSan: 'NFS',
    rettSan: 'RS',
    san: 'San',
};

const personnelTypeNames: {
    [key in PersonnelType]: string;
} = {
    gf: 'Gruppenführer',
    notarzt: 'Notarzt',
    notSan: 'Notfallsanitäter',
    rettSan: 'Rettungssanitäter',
    san: 'Sanitäter',
};

const mapImageTemplateIds: {
    [key in string]: UUID;
} = {
    '/assets/fire.svg': uuid(),
    '/assets/house-fire.svg': uuid(),
};

function migrateVehicleTemplate(vehicleTemplate: VehicleTemplate) {
    vehicleTemplate.materialTemplateIds = vehicleTemplate.materials!.map(
        (materialType) => materialTemplateIds[materialType]
    );
    delete vehicleTemplate.materials;
    vehicleTemplate.personnelTemplateIds = vehicleTemplate.personnel!.map(
        (personnelType) => personnelTemplateIds[personnelType]
    );
    delete vehicleTemplate.personnel;
    return vehicleTemplate;
}

function migrateMapImage(mapImage: MapImage) {
    mapImage.id = mapImageTemplateIds[mapImage.image.url];
}

function migrateMaterial(material: Material) {
    const materialType: MaterialType =
        material.image.url === '/assets/material.svg' ? 'standard' : 'big';
    material.templateId = materialTemplateIds[materialType];
    material.name = materialTypeNames[materialType];
    return material;
}

function migratePersonnel(personnel: Personnel) {
    personnel.typeName = personnelTypeNames[personnel.personnelType];
    personnel.templateId = personnelTemplateIds[personnel.personnelType];
    personnel.typeAbbreviation =
        personnelTypeAbbreviations[personnel.personnelType];
}

export const generalizeMaterialsPersonnel43: Migration = {
    action: (_, action) => {
        const actionType = (action as { type: string }).type;

        if (actionType === '[Vehicle] Add vehicle') {
            const typedAction = action as {
                vehicleParameters: VehicleParameters;
            };
            typedAction.vehicleParameters.materials.forEach(migrateMaterial);
            typedAction.vehicleParameters.personnel.forEach(migratePersonnel);
        } else if (
            actionType === '[Emergency Operation Center] Send Alarm Group'
        ) {
            const typedAction = action as {
                sortedVehicleParameters: VehicleParameters[];
            };
            Object.values(typedAction.sortedVehicleParameters).forEach(
                (vehicleParameters) =>
                    vehicleParameters.materials.forEach(migrateMaterial)
            );
            Object.values(typedAction.sortedVehicleParameters).forEach(
                (vehicleParameters) =>
                    vehicleParameters.personnel.forEach(migratePersonnel)
            );
        } else if (actionType === '[VehicleTemplate] Add vehicleTemplate') {
            const typedAction = action as {
                vehicleTemplate: VehicleTemplate;
            };
            migrateVehicleTemplate(typedAction.vehicleTemplate);
        } else if (actionType === '[VehicleTemplate] Edit vehicleTemplate') {
            const typedAction = action as {
                materials?: MaterialType[];
                personnelTypes?: PersonnelType[];
                materialTemplateIds?: UUID[];
                personnelTemplateIds?: UUID[];
            };
            typedAction.materialTemplateIds = typedAction.materials!.map(
                (materialType) => materialTemplateIds[materialType]
            );
            delete typedAction.materials;
            typedAction.personnelTemplateIds = typedAction.personnelTypes!.map(
                (personnelType) => personnelTemplateIds[personnelType]
            );
            delete typedAction.personnelTypes;
        } else if (actionType === '[MapImage] Add MapImage') {
            const typedAction = action as {
                mapImage: MapImage;
            };
            migrateMapImage(typedAction.mapImage);
        }

        return true;
    },
    state: (state) => {
        const typedState = state as {
            materialTemplates: {
                [Key in MaterialType | UUID]: MaterialTemplate;
            };
            vehicleTemplates:
                | VehicleTemplate[]
                | { [Key in UUID]: VehicleTemplate };
            materials: { [key: UUID]: Material };
            personnelTemplates: {
                [Key in PersonnelType | UUID]: PersonnelTemplate;
            };
            personnel: { [key: UUID]: Personnel };
            mapImageTemplates:
                | MapImageTemplate[]
                | { [Key in UUID]: MapImageTemplate };
            mapImages: { [key: UUID]: MapImage };
        };

        Object.values(typedState.materialTemplates).forEach((template) => {
            template.id = materialTemplateIds[template.materialType!];
            template.typeName = materialTypeNames[template.materialType!];
            typedState.materialTemplates[template.id] = template;
            delete typedState.materialTemplates[template.materialType!];
            delete template.materialType;
        });
        Object.values(typedState.materials).forEach(migrateMaterial);

        Object.values(typedState.personnelTemplates).forEach((template) => {
            template.name = personnelTypeNames[template.personnelType];
            template.id = personnelTemplateIds[template.personnelType];
            template.abbreviation =
                personnelTypeAbbreviations[template.personnelType];
            typedState.personnelTemplates[template.id] = template;
            delete typedState.personnelTemplates[template.personnelType];
        });
        Object.values(typedState.personnel).forEach(migratePersonnel);

        const newVehicleTemplates: { [key in UUID]: VehicleTemplate } = {};
        (typedState.vehicleTemplates as VehicleTemplate[]).forEach(
            (vehicleTemplate) => {
                newVehicleTemplates[vehicleTemplate.id] =
                    migrateVehicleTemplate(vehicleTemplate);
            }
        );
        typedState.vehicleTemplates = newVehicleTemplates;

        Object.values(typedState.mapImages).forEach((mapImage) => {
            migrateMapImage(mapImage);
        });

        const newMapImageTemplates: { [key in UUID]: MapImageTemplate } = {};
        (typedState.mapImageTemplates as MapImageTemplate[]).forEach(
            (mapImageTemplate) => {
                newMapImageTemplates[mapImageTemplate.id] = mapImageTemplate;
            }
        );
    },
};
