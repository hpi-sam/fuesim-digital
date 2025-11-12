import type { UUID } from '../utils/index.js';
import type { ImageProperties } from '../models/index.js';
import { uuid } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

interface VehicleTemplate {
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
    baseTemplateId?: UUID;
    personnelType: PersonnelType;
    name?: string;
    abbreviation?: string;
}
interface MaterialTemplate {
    id?: UUID;
    materialType?: MaterialType;
    name?: string;
}
interface Material {
    baseTemplateId?: UUID;
    name?: string;
    image: ImageProperties;
}
interface VehicleParameters {
    materials: Material[];
    personnel: Personnel[];
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
    [Key in string]: string;
} = {
    gf: 'GF',
    notarzt: 'NA',
    notSan: 'NFS',
    rettSan: 'RS',
    san: 'San',
};

export const personnelTypeNames: {
    [key in string]: string;
} = {
    gf: 'Gruppenführer',
    notarzt: 'Notarzt',
    notSan: 'Notfallsanitäter',
    rettSan: 'Rettungssanitäter',
    san: 'Sanitäter',
};
export const generalizeMaterialTypes42: Migration = {
    action: (_, action) => {
        const actionType = (action as { type: string }).type;

        if (actionType === '[Vehicle] Add vehicle') {
            const typedAction = action as {
                vehicleParameters: VehicleParameters;
            };
            typedAction.vehicleParameters.materials.forEach((material) => {
                const materialType: MaterialType =
                    material.image.url === '/assets/material.svg'
                        ? 'standard'
                        : 'big';
                material.baseTemplateId = materialTemplateIds[materialType];
                material.name = materialTypeNames[materialType];
            });
            typedAction.vehicleParameters.personnel.forEach((personnel) => {
                personnel.name = personnelTypeNames[personnel.personnelType];
                personnel.baseTemplateId =
                    personnelTemplateIds[personnel.personnelType];
                personnel.abbreviation =
                    personnelTypeAbbreviations[personnel.personnelType];
            });
        } else if (
            actionType === '[Emergency Operation Center] Send Alarm Group'
        ) {
            const typedAction = action as {
                sortedVehicleParameters: VehicleParameters[];
            };
            Object.values(typedAction.sortedVehicleParameters).forEach(
                (vehicleParameters) =>
                    vehicleParameters.materials.forEach((material) => {
                        const materialType: MaterialType =
                            material.image.url === '/assets/material.svg'
                                ? 'standard'
                                : 'big';
                        material.baseTemplateId =
                            materialTemplateIds[materialType];
                        material.name = materialTypeNames[materialType];
                    })
            );
            Object.values(typedAction.sortedVehicleParameters).forEach(
                (vehicleParameters) =>
                    vehicleParameters.personnel.forEach((personnel) => {
                        personnel.name =
                            personnelTypeNames[personnel.personnelType];
                        personnel.baseTemplateId =
                            personnelTemplateIds[personnel.personnelType];
                        personnel.abbreviation =
                            personnelTypeAbbreviations[personnel.personnelType];
                    })
            );
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
        }

        return true;
    },
    state: (state) => {
        const typedState = state as {
            materialTemplates: {
                [Key in MaterialType]: MaterialTemplate;
            };
            vehicleTemplates: VehicleTemplate[];
            materials: { [key: UUID]: Material };
            personnelTemplates: {
                [Key in PersonnelType]: PersonnelTemplate;
            };
            personnel: { [key: UUID]: Personnel };
        };

        Object.values(typedState.materialTemplates).forEach((template) => {
            template.id = materialTemplateIds[template.materialType!];
            template.name = materialTypeNames[template.materialType!];
            delete template.materialType;
        });
        Object.values(typedState.materials).forEach((material) => {
            const materialType: MaterialType =
                material.image.url === '/assets/material.svg'
                    ? 'standard'
                    : 'big';
            material.baseTemplateId = materialTemplateIds[materialType];
            material.name = materialTypeNames[materialType];
        });
        Object.values(typedState.personnelTemplates).forEach((template) => {
            template.name = personnelTypeNames[template.personnelType];
            template.id = personnelTemplateIds[template.personnelType];
            template.abbreviation =
                personnelTypeAbbreviations[template.personnelType];
        });
        Object.values(typedState.personnel).forEach((personnel) => {
            personnel.name = personnelTypeNames[personnel.personnelType];
            personnel.baseTemplateId =
                personnelTemplateIds[personnel.personnelType];
            personnel.abbreviation =
                personnelTypeAbbreviations[personnel.personnelType];
        });
        typedState.vehicleTemplates.forEach((vehicleTemplate) => {
            vehicleTemplate.materialTemplateIds =
                vehicleTemplate.materials!.map(
                    (materialType) => materialTemplateIds[materialType]
                );
            delete vehicleTemplate.materials;
            vehicleTemplate.personnelTemplateIds =
                vehicleTemplate.personnel!.map(
                    (personnelType) => personnelTemplateIds[personnelType]
                );
            delete vehicleTemplate.personnel;
        });
    },
};
