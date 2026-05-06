import type { CollectionDto, ElementDto } from 'fuesim-digital-shared';
import {
    collectionEntityIdSchema,
    collectionVersionIdSchema,
    defaultVehicleTemplatesById,
    elementEntityIdSchema,
    elementVersionIdSchema,
} from 'fuesim-digital-shared';
import type { Immutable } from 'immer';

export type DefaultElement = Immutable<Omit<ElementDto, 'stateVersion'>>;

export type DefaultCollection = Omit<CollectionDto, 'stateVersion'> & {
    elements: DefaultElement[];
};

function newElementVersionId(uuid: string) {
    return elementVersionIdSchema.parse(`element_version_${uuid}`);
}

function newElementEntityId(uuid: string) {
    return elementEntityIdSchema.parse(`element_entity_${uuid}`);
}

// WARNING:: DO NOT CHANGE THESE VALUES UNLESS ABSOLUTELY NECESSARY,
// OTHERWISE YOU MIGHT BREAK EXISTING EXERCISES THAT RELY ON THESE DEFAULT ELEMENTS.
// IF YOU WANT TO CHANGE THESE ELEMENTS,
// PLEASE CREATE A NEW SET OF DEFAULT ELEMENTS (e.g.  FüSim Digital {YEAR} Übungselemente)
const fuesimManvDefaultCollectionData: DefaultCollection = {
    entityId: collectionEntityIdSchema.parse(
        'set_entity_76dcdff5-9dd5-4430-b7a7-f680479977ae'
    ),
    versionId: collectionVersionIdSchema.parse(
        'set_version_7743eb0c-dee1-4d7a-9159-911c7a2e9253'
    ),
    title: 'FüSim MANV 2025 Übungselemente',
    description: '',
    archived: false,
    createdAt: new Date(2022, 6, 27), // 27.07.2022 (date where, notsan was added e.g.)
    editedAt: new Date(2023, 6, 10), // 10.07.2023 (date where, nef-vehicle was edited e.g.)
    draftState: false,
    elementCount: 0,
    version: 1,
    visibility: 'embedded',
    elements: Object.values(defaultVehicleTemplatesById).map((template) => ({
        title: template.vehicleType,
        description: '',
        content: template,
        entityId: newElementEntityId(template.id),
        versionId: newElementVersionId(template.id),
        createdAt: new Date(2023, 6, 10),
        editedAt: new Date(2023, 6, 10),
        version: 1,
    })),
};

export const defaultCollectionData: DefaultCollection[] = [
    fuesimManvDefaultCollectionData,
];
