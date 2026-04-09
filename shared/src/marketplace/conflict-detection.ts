import { z } from 'zod';
import {
    ElementDto,
    elementDtoSchema,
    ElementVersionId,
    elementVersionIdSchema,
    VersionedElementContent,
} from '../models/index.js';

const deletedElementDtoSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('remove'),
    old: elementDtoSchema,
    new: z.null(),
});

const updatedElementDtoSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('update'),
    old: elementDtoSchema,
    new: elementDtoSchema,
});

const addedElementDtoSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('create'),
    old: z.null(),
    new: elementDtoSchema,
});

export const changedElementDtoSchema = z.union([
    deletedElementDtoSchema,
    updatedElementDtoSchema,
    addedElementDtoSchema,
]);

export type ChangedElementDto = z.infer<typeof changedElementDtoSchema>;

export const changeDependenciesSchema = z.record(
    elementVersionIdSchema,
    z.array(elementDtoSchema)
);

export type ChangeDependencies = z.infer<typeof changeDependenciesSchema>;

export function getCollectionElementDiff(
    currentElements: ElementDto[],
    newElements: ElementDto[]
): ChangedElementDto[] {
    console.log(currentElements);
    console.log(newElements);
    const changes: ChangedElementDto[] = [];

    const currentElementEntityIds = new Set(
        currentElements.map((element) => element.entityId)
    );
    const newElementEntityIds = new Set(
        newElements.map((element) => element.entityId)
    );

    currentElements
        .filter((element) => !newElementEntityIds.has(element.entityId))
        .forEach((removedElement) => {
            changes.push({
                id: removedElement.versionId,
                type: 'remove',
                old: removedElement,
                new: null,
            });
        });

    newElements
        .filter((element) => !currentElementEntityIds.has(element.entityId))
        .forEach((addedElement) => {
            changes.push({
                id: addedElement.versionId,
                type: 'create',
                old: null,
                new: addedElement,
            });
        });

    const overlappingNew = newElements.filter((element) =>
        currentElementEntityIds.has(element.entityId)
    );

    // TODO: @Quixelation -> we should also do a content diff, to see if the content was actually significantly changed
    // But this is something for a later point (ba-thesis?)
    overlappingNew
        .map((newElement) => {
            const matchingCurrentElement = currentElements.find(
                (element) => element.entityId === newElement.entityId
            );
            if (!matchingCurrentElement) {
                throw new Error(
                    'This should not happen, since we are filtering for overlapping elements'
                );
            }
            if (newElement.versionId !== matchingCurrentElement.versionId) {
                return {
                    old: matchingCurrentElement,
                    new: newElement,
                };
            }
            return null;
        })
        .filter((v) => v !== null)
        .forEach((potentiallyUpdated) => {
            changes.push({
                id: potentiallyUpdated.new.versionId,
                type: 'update',
                old: potentiallyUpdated!.old,
                new: potentiallyUpdated!.new,
            });
        });

    return changes;
}

export function findElementVersionsInContent(
    content: VersionedElementContent,
    removeVersionIds: ElementVersionId[] = []
): { ids: ElementVersionId[]; newContent: VersionedElementContent } {
    switch (content.type) {
        case 'alarmGroup': {
            content.alarmGroupVehicles = Object.fromEntries(
                Object.entries(content.alarmGroupVehicles).filter(
                    ([, vehicle]) =>
                        !removeVersionIds.includes(vehicle.vehicleTemplateId)
                )
            );
            return {
                ids: Object.values(content.alarmGroupVehicles).map(
                    (vehicle) => vehicle.vehicleTemplateId
                ),
                newContent: content,
            };
        }
        case 'vehicleTemplate': {
            return {
                ids: [],
                newContent: content,
            };
        }
    }
}
