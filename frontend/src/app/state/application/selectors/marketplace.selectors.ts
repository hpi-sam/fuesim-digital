import { createSelector } from '@ngrx/store';
import type {
    CollectionElements,
    CollectionEntityId,
    ElementVersionId,
    ExerciseState,
    TemplateVersion,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { cloneDeepMutable } from 'fuesim-digital-shared';
import { selectExerciseState } from './exercise.selectors';

function getTemplateFromExerciseState(
    exerciseState: ExerciseState,
    versionId: ElementVersionId
): VersionedElementContent {
    const template = Object.values(exerciseState.templates).find(
        (element) => element.entity?.versionId === versionId
    );
    if (!template) {
        throw new Error(`Template with versionId ${versionId} not found`);
    }
    return template;
}

function convertVersionedElementContentToTemplateVersion(
    template: VersionedElementContent
): TemplateVersion {
    const entity = template.entity;
    if (!entity) {
        throw new Error(
            `Template with id ${template.id} does not have an entity`
        );
    }
    return {
        content: template,
        ...entity,
    } satisfies TemplateVersion;
}

export function selectTemplatesFromCollectionEntity(
    collectionEntity: CollectionEntityId
) {
    return createSelector(
        selectExerciseState,
        (exerciseState): CollectionElements => {
            const collection = exerciseState.selectedCollections.find(
                (c) => c.entityId === collectionEntity
            );

            const collectionElements = collection?.elements;

            if (!collectionElements) {
                throw new Error(
                    `Collection with entityId ${collectionEntity} not found`
                );
            }

            const directElements = collectionElements.direct.map((element) =>
                convertVersionedElementContentToTemplateVersion(
                    getTemplateFromExerciseState(
                        exerciseState,
                        element.versionId
                    )
                )
            );
            const importedElements = collectionElements.imported.map(
                (importedCollection) => ({
                    collection: importedCollection.collection,
                    elements: importedCollection.elements.map((element) =>
                        convertVersionedElementContentToTemplateVersion(
                            getTemplateFromExerciseState(
                                exerciseState,
                                element.versionId
                            )
                        )
                    ),
                })
            );

            const referenceElements = collectionElements.references.map(
                (referenceCollection) => ({
                    collection: referenceCollection.collection,
                    elements: referenceCollection.elements.map((element) =>
                        convertVersionedElementContentToTemplateVersion(
                            getTemplateFromExerciseState(
                                exerciseState,
                                element.versionId
                            )
                        )
                    ),
                })
            );

            return {
                direct: cloneDeepMutable(directElements),
                imported: cloneDeepMutable(importedElements),
                references: cloneDeepMutable(referenceElements),
            };
        }
    );
}

export function selectTemplateByVersionId(versionId: ElementVersionId) {
    return createSelector(selectExerciseState, (exerciseState) =>
        getTemplateFromExerciseState(exerciseState, versionId)
    );
}
