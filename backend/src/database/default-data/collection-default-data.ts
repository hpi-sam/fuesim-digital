import type {
    CollectionVersion,
    ElementVersionId,
    TemplateVersion,
} from 'fuesim-digital-shared';
import {
    collectionEntityIdSchema,
    collectionVersionIdSchema,
    defaultMapImagesTemplates,
    defaultMaterialTemplates,
    defaultPersonnelTemplates,
    defaultVehicleTemplatesById,
    elementEntityIdSchema,
    elementVersionIdSchema,
    replaceDependencies,
} from 'fuesim-digital-shared';
import type { Immutable } from 'immer';

export type DefaultElement = Immutable<Omit<TemplateVersion, 'stateVersion'>>;

export type DefaultCollection = Omit<CollectionVersion, 'stateVersion'> & {
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
        'collection_entity_76dcdff5-9dd5-4430-b7a7-f680479977ae'
    ),
    versionId: collectionVersionIdSchema.parse(
        'collection_version_7743eb0c-dee1-4d7a-9159-911c7a2e9253'
    ),
    title: 'FüSim MANV 2025 Übungselemente',
    description: '',
    archived: false,
    createdAt: new Date(2022, 6, 27), // 27.07.2022 (date where, notsan was added e.g.)
    editedAt: new Date(2023, 6, 10), // 10.07.2023 (date where, nef-vehicle was edited e.g.)
    draftState: false,
    version: 1,
    visibility: 'embedded',
    elements: [
        ...Object.values(defaultVehicleTemplatesById).map((template) => ({
            title: template.vehicleType,
            description: '',
            content: replaceDependencies(template, [
                ...Object.values(defaultMaterialTemplates).map((t) => ({
                    old: t.id as ElementVersionId,
                    new: newElementVersionId(t.id),
                })),
                ...Object.values(defaultPersonnelTemplates).map((t) => ({
                    old: t.id as ElementVersionId,
                    new: newElementVersionId(t.id),
                })),
            ]),
            entityId: newElementEntityId(template.id),
            versionId: newElementVersionId(template.id),
            createdAt: new Date(2023, 6, 10),
            editedAt: new Date(2023, 6, 10),
            version: 1,
        })),

        ...Object.values(defaultMapImagesTemplates).map((template) => ({
            title: template.name,
            description: '',
            content: template,
            entityId: newElementEntityId(template.id),
            versionId: newElementVersionId(template.id),
            createdAt: new Date(2023, 6, 10),
            editedAt: new Date(2023, 6, 10),
            version: 1,
        })),

        ...Object.values(defaultPersonnelTemplates).map((template) => ({
            title: template.name,
            description: '',
            content: template,
            entityId: newElementEntityId(template.id),
            versionId: newElementVersionId(template.id),
            createdAt: new Date(2023, 6, 10),
            editedAt: new Date(2023, 6, 10),
            version: 1,
        })),

        ...Object.values(defaultMaterialTemplates).map((template) => ({
            title: template.name,
            description: '',
            content: template,
            entityId: newElementEntityId(template.id),
            versionId: newElementVersionId(template.id),
            createdAt: new Date(2023, 6, 10),
            editedAt: new Date(2023, 6, 10),
            version: 1,
        })),
    ],
};

export const defaultCollectionData: DefaultCollection[] = [
    fuesimManvDefaultCollectionData,
];
