import type { UUID } from '../utils/index.js';
import type { ImageProperties } from '../models/index.js';
import type { Migration } from './migration-functions.js';

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
    // personnel: Personnel[];
}
type MaterialType = 'big' | 'standard';

const materialTypeNames: {
    [key in MaterialType]: string;
} = {
    big: 'Erweitertes Material',
    standard: 'Standardmaterial',
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
        }

        return true;
    },
    state: (state) => {
        const typedState = state as {
            materialTemplates: {
                [Key in MaterialType]: MaterialTemplate;
            };
            materials: { [key: UUID]: Material };
            // personnelTemplates: {
            //     [Key in PersonnelType]: PersonnelTemplate;
            // };
            // personnel: { [key: UUID]: Personnel };
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
    },
};
