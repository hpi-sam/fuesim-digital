import type { UUID } from '../utils/index.js';
import type { ImageProperties } from '../models/index.js';
import type { Migration } from './migration-functions.js';

interface PersonnelTemplate {
    personnelType: PersonnelType;
    name?: string;
    abbreviation?: string;
}
interface Personnel {
    personnelType: PersonnelType;
    name?: string;
    abbreviation?: string;
}
interface MaterialTemplate {
    materialType: MaterialType;
    name?: string;
}
interface Material {
    materialType?: MaterialType;
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
        if ((action as { type: string }).type === '[Vehicle] Add vehicle') {
            const typedAction = action as {
                vehicleParameters: VehicleParameters;
            };
            typedAction.vehicleParameters.materials.forEach((material) => {
                material.materialType =
                    material.image.url === '/assets/material.svg'
                        ? 'standard'
                        : 'big';
                material.name = materialTypeNames[material.materialType];
            });
            typedAction.vehicleParameters.personnel.forEach((personnel) => {
                personnel.name = personnelTypeNames[personnel.personnelType];
                personnel.abbreviation =
                    personnelTypeAbbreviations[personnel.personnelType];
            });
        }

        if (
            (action as { type: string }).type ===
            '[Emergency Operation Center] Send Alarm Group'
        ) {
            const typedAction = action as {
                sortedVehicleParameters: VehicleParameters[];
            };
            Object.values(typedAction.sortedVehicleParameters).forEach(
                (vehicleParameters) =>
                    vehicleParameters.materials.forEach((material) => {
                        material.materialType =
                            material.image.url === '/assets/material.svg'
                                ? 'standard'
                                : 'big';
                        material.name =
                            materialTypeNames[material.materialType];
                    })
            );
            Object.values(typedAction.sortedVehicleParameters).forEach(
                (vehicleParameters) =>
                    vehicleParameters.personnel.forEach((personnel) => {
                        personnel.name =
                            personnelTypeNames[personnel.personnelType];
                        personnel.abbreviation =
                            personnelTypeAbbreviations[personnel.personnelType];
                    })
            );
        }

        return true;
    },
    state: (state) => {
        const typedState = state as {
            materialTemplates: {
                [Key in MaterialType]: MaterialTemplate;
            };
            materials: { [key: UUID]: Material };
            personnelTemplates: {
                [Key in PersonnelType]: PersonnelTemplate;
            };
            personnel: { [key: UUID]: Personnel };
        };

        Object.values(typedState.materialTemplates).forEach((template) => {
            template.name = materialTypeNames[template.materialType];
        });
        Object.values(typedState.materials).forEach((material) => {
            material.materialType =
                material.image.url === '/assets/material.svg'
                    ? 'standard'
                    : 'big';
            material.name = materialTypeNames[material.materialType];
        });
        Object.values(typedState.personnelTemplates).forEach((template) => {
            template.name = personnelTypeNames[template.personnelType];
            template.abbreviation =
                personnelTypeAbbreviations[template.personnelType];
        });
        Object.values(typedState.personnel).forEach((personnel) => {
            personnel.name = personnelTypeNames[personnel.personnelType];
            personnel.abbreviation =
                personnelTypeAbbreviations[personnel.personnelType];
        });
    },
};
