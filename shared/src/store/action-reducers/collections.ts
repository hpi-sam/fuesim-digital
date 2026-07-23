import type { Immutable, WritableDraft } from 'immer';
import { z } from 'zod';
import type { ActionReducer } from '../action-reducer.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { CollectionElementType } from '../../marketplace/models/collection-element-type.js';
import type { ExerciseState } from '../../state.js';
import type { ChangeApply } from '../../marketplace/exercise-collection-upgrade/exercise-collection-change-apply.js';
import { changeApplySchema } from '../../marketplace/exercise-collection-upgrade/exercise-collection-change-apply.js';
import {
    hasEntityProperties,
    marketplaceElementsDefinitions,
} from '../../marketplace/elements/marketplace-elements.js';
import {
    type CollectionElements,
    collectionElementsSchema,
    collectionVersionStructureSchema,
    gatherAllCollectionElements,
} from '../../marketplace/models/collection-elements.js';
import type { TemplateVersion } from '../../marketplace/models/versioned-elements.js';
import { collectionVersionSchema } from '../../marketplace/models/collection.js';
import { versionedCollectionPartialSchema } from '../../marketplace/models/versioned-id-schema.js';

export const addCollectionActionSchema = z.strictObject({
    type: z.literal('[Collection] Add Collection'),
    collection: collectionVersionSchema,
    elements: collectionElementsSchema,
});
export type AddCollectionAction = Immutable<
    z.infer<typeof addCollectionActionSchema>
>;

export const upgradeCollectionActionSchema = z.strictObject({
    type: z.literal('[Collection] Upgrade Collection'),
    collection: collectionVersionSchema,
    collectionElements: collectionElementsSchema,
    overwriteTemplates: collectionElementsSchema,
    changeApplies: z.array(changeApplySchema),
});

export type UpgradeCollectionAction = Immutable<
    z.infer<typeof upgradeCollectionActionSchema>
>;

export const removeCollectionActionSchema = z.strictObject({
    type: z.literal('[Collection] Remove Collection'),
    collectionVersion: versionedCollectionPartialSchema,
    keepTemplates: collectionVersionStructureSchema,
    changeApplies: z.array(changeApplySchema),
});

export type RemoveCollectionAction = Immutable<
    z.infer<typeof removeCollectionActionSchema>
>;

function addElement(
    draftState: WritableDraft<ExerciseState>,
    element: Immutable<TemplateVersion>,
    type: CollectionElementType,
    useVersionId: boolean = false
) {
    const mutableElement = cloneDeepMutable(element);

    const id = useVersionId ? element.versionId : element.content.id;
    draftState.templates[id] = {
        ...mutableElement.content,
        id: useVersionId ? element.versionId : element.content.id,
        entity: {
            entityId: element.entityId,
            versionId: element.versionId,
            type,
        },
    };
}

function addCollectionElements(
    draftState: WritableDraft<ExerciseState>,
    elements: Immutable<CollectionElements>
) {
    for (const directElement of elements.direct) {
        addElement(draftState, directElement, 'direct', true);
    }
    for (const elementType of ['imported', 'references'] as const) {
        for (const collectionElements of elements[elementType]) {
            for (const element of collectionElements.elements) {
                addElement(draftState, element, elementType, true);
            }
        }
    }
}

export namespace CollectionReducers {
    export const addCollection: ActionReducer<AddCollectionAction> = {
        type: addCollectionActionSchema.shape.type.value,
        actionSchema: addCollectionActionSchema,
        reducer: (draftState, data) => {
            addCollectionElements(draftState, data.elements);

            draftState.selectedCollections.push({
                entityId: data.collection.entityId,
                versionId: data.collection.versionId,
            });

            return draftState;
        },
        rights: 'trainer',
    };
    export const upgradeCollection: ActionReducer<UpgradeCollectionAction> = {
        type: upgradeCollectionActionSchema.shape.type.value,
        actionSchema: upgradeCollectionActionSchema,
        reducer: (draftState, data) => {
            overwriteStateTemplates(draftState, data.overwriteTemplates);

            // THIS VERSION IS THE "LITE"-MARKETPLACE
            // CHANGE APPLIES ARE NOT YET IMPLEMENTED
            // IF YOU PASS IN ANYTHING BUT AN EMPTY ARRAY
            // IT *WILL* THROW AN ERROR
            applyAllChangeApplies(draftState, data.changeApplies);

            draftState.selectedCollections = cloneDeepMutable(
                draftState.selectedCollections.map((collection) => {
                    if (collection.entityId === data.collection.entityId) {
                        return cloneDeepMutable({
                            ...data.collection,
                            elements: {
                                direct: data.collectionElements.direct.map(
                                    (element) => ({
                                        entityId: element.entityId,
                                        versionId: element.versionId,
                                    })
                                ),
                                imported: data.collectionElements.imported.map(
                                    (element) => ({
                                        collection: element.collection,
                                        elements: element.elements,
                                    })
                                ),
                                references:
                                    data.collectionElements.references.map(
                                        (element) => ({
                                            collection: element.collection,
                                            elements: element.elements,
                                        })
                                    ),
                            },
                        });
                    }
                    return collection;
                })
            );

            return draftState;
        },
        rights: 'trainer',
    };
    export const removeCollection: ActionReducer<RemoveCollectionAction> = {
        type: removeCollectionActionSchema.shape.type.value,
        actionSchema: removeCollectionActionSchema,
        reducer: (draftState, data) => {
            draftState.templates = Object.fromEntries(
                Object.entries(draftState.templates)
                    .map(([id, element]) => {
                        if (!hasEntityProperties(element)) {
                            return [id, element];
                        }
                        if (
                            gatherAllCollectionElements(
                                cloneDeepMutable(data.keepTemplates)
                            ).some(
                                (e) => e.versionId === element.entity.versionId
                            )
                        ) {
                            return [id, element];
                        }
                        return [id, false];
                    })
                    .filter(([_, element]) => element !== false)
            );
            applyAllChangeApplies(draftState, data.changeApplies);

            // Remove the collection from the selected collections in the state
            draftState.selectedCollections =
                draftState.selectedCollections.filter(
                    (collection) =>
                        collection.entityId !== data.collectionVersion.entityId
                );

            return draftState;
        },
        rights: 'trainer',
    };
}

function overwriteStateTemplates(
    draftState: WritableDraft<ExerciseState>,
    elements: Immutable<CollectionElements>
) {
    // Remove old templates
    draftState.templates = Object.fromEntries(
        Object.entries(draftState.templates).filter(
            ([_, element]) => !hasEntityProperties(element)
        )
    );

    // Add new templates from the collections to state
    addCollectionElements(draftState, elements);
}

function applyAllChangeApplies(
    draftState: WritableDraft<ExerciseState>,
    changeApplies: Immutable<ChangeApply[]>
) {
    for (const changeApply of changeApplies) {
        for (const entry of Object.values(marketplaceElementsDefinitions)) {
            entry.changeApply(draftState, changeApply);
        }
    }
}
