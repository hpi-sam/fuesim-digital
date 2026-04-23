import type { WritableDraft } from 'immer';
import type { UUID } from '../utils/uuid.js';
import { uuid } from '../utils/uuid.js';
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
    vehicleType: string;
}
interface Vehicle {
    id: UUID;
    templateId?: UUID;
    vehicleType: string;
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
    name?: string;
}
interface Material {
    templateId?: UUID;
    typeName?: string;
    image: ImageProperties;
}
interface VehicleParameters {
    materials: Material[];
    personnel: Personnel[];
    vehicle: Vehicle;
}
interface MapImageTemplate {
    id: UUID;
    image: ImageProperties;
}
interface MapImage {
    templateId?: UUID;
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

function getTemplateIds(
    vehicleTemplates: VehicleTemplate[],
    mapImageTemplates: MapImageTemplate[]
) {
    const vehicleTemplateIds: {
        [key in string]: UUID;
    } = Object.fromEntries(
        vehicleTemplates.map((template) => [template.vehicleType, template.id])
    );
    const mapImageTemplateIds: {
        [key in string]: UUID;
    } = Object.fromEntries(
        mapImageTemplates.map((template) => [template.image.url, template.id])
    );
    return { vehicleTemplateIds, mapImageTemplateIds };
}

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

function migrateMapImage(
    mapImage: MapImage,
    mapImageTemplateIds: { [key in string]: UUID }
) {
    mapImage.templateId = mapImageTemplateIds[mapImage.image.url];
}

function migrateVehicle(
    vehicle: Vehicle,
    vehicleTemplateIds: { [key in string]: UUID }
) {
    vehicle.templateId = vehicleTemplateIds[vehicle.vehicleType] ?? vehicle.id;
}

function migrateMaterial(material: Material) {
    const materialType: MaterialType =
        material.image.url === '/assets/material.svg' ? 'standard' : 'big';
    material.templateId = materialTemplateIds[materialType];
    material.typeName = materialTypeNames[materialType];
    return material;
}

function migratePersonnel(personnel: Personnel) {
    personnel.typeName = personnelTypeNames[personnel.personnelType];
    personnel.templateId = personnelTemplateIds[personnel.personnelType];
    personnel.typeAbbreviation =
        personnelTypeAbbreviations[personnel.personnelType];
}

export const generalizeMaterialsPersonnel44: Migration = {
    action: (intermediaryState, action) => {
        const actionType = (action as { type: string }).type;
        const mutableIntermediaryState = intermediaryState as WritableDraft<{
            vehicleTemplates: { [Key in UUID]: VehicleTemplate };
            mapImageTemplates: { [Key in UUID]: MapImageTemplate };
        }>;

        console.log(mutableIntermediaryState);
        const { mapImageTemplateIds, vehicleTemplateIds } = getTemplateIds(
            Object.values(mutableIntermediaryState.vehicleTemplates),
            Object.values(mutableIntermediaryState.mapImageTemplates)
        );
        if (actionType === '[Vehicle] Add vehicle') {
            const typedAction = action as {
                vehicleParameters: VehicleParameters;
            };
            typedAction.vehicleParameters.materials.forEach(migrateMaterial);
            typedAction.vehicleParameters.personnel.forEach(migratePersonnel);
            migrateVehicle(
                typedAction.vehicleParameters.vehicle,
                vehicleTemplateIds
            );
        } else if (
            actionType === '[Emergency Operation Center] Send Alarm Group'
        ) {
            const typedAction = action as {
                sortedVehicleParameters: VehicleParameters[];
            };
            Object.values(typedAction.sortedVehicleParameters).forEach(
                (vehicleParameters) => {
                    vehicleParameters.materials.forEach(migrateMaterial);
                    vehicleParameters.personnel.forEach(migratePersonnel);
                    migrateVehicle(
                        vehicleParameters.vehicle,
                        vehicleTemplateIds
                    );
                }
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
            migrateMapImage(typedAction.mapImage, mapImageTemplateIds);
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
            vehicles: { [key: UUID]: Vehicle };
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

        const { mapImageTemplateIds, vehicleTemplateIds } = getTemplateIds(
            typedState.vehicleTemplates as VehicleTemplate[],
            typedState.mapImageTemplates as MapImageTemplate[]
        );

        Object.values(typedState.materialTemplates).forEach((template) => {
            template.id = materialTemplateIds[template.materialType!];
            template.name = materialTypeNames[template.materialType!];
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

        Object.values(typedState.vehicles).forEach((vehicle) => {
            migrateVehicle(vehicle, vehicleTemplateIds);
        });

        Object.values(typedState.mapImages).forEach((mapImage) => {
            migrateMapImage(mapImage, mapImageTemplateIds);
        });

        const newMapImageTemplates: { [key in UUID]: MapImageTemplate } = {};
        (typedState.mapImageTemplates as MapImageTemplate[]).forEach(
            (mapImageTemplate) => {
                newMapImageTemplates[mapImageTemplate.id] = mapImageTemplate;
            }
        );
        typedState.mapImageTemplates = newMapImageTemplates;
    },
};
