import type { Migration } from './migration-functions.js';

interface TypedState<
    Material extends object,
    Vehicle extends object,
    Personnel extends object,
    MapImage extends object,
> {
    templates?: {
        [key: string]: MapImage | Material | Personnel | Vehicle;
    };
    materialTemplates?: {
        [key: string]: Material;
    };
    vehicleTemplates?: {
        [key: string]: Vehicle;
    };
    personnelTemplates?: {
        [key: string]: Personnel;
    };
    mapImageTemplates?: {
        [key: string]: MapImage;
    };
}

export const generalizedTemplates53: Migration = {
    unmigratableActions: true,
    action: null,
    state: (state) => {
        const typedState = state as TypedState<object, object, object, object>;
        typedState.templates = {
            ...typedState.materialTemplates,
            ...typedState.vehicleTemplates,
            ...typedState.personnelTemplates,
            ...typedState.mapImageTemplates,
        };
        delete typedState.materialTemplates;
        delete typedState.vehicleTemplates;
        delete typedState.personnelTemplates;
        delete typedState.mapImageTemplates;
    },
};
