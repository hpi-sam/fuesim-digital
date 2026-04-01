import type {
    AlarmGroup,
    ElementDto,
    ElementEntityId,
    ElementVersionId,
} from 'fuesim-digital-shared';
import { createTestEnvironment } from '../../test/utils.js';

describe('Collection Service', () => {
    const environment = createTestEnvironment();

    describe('Dependency-Upgrade-Possible-Check', () => {
        let collectionElements: ElementDto[] = [];

        const createElementDto = (
            version: number,
            name: string
        ): ElementDto => ({
            versionId: `element_version_${version}` as ElementVersionId,
            entityId: `element_entity_${name}` as ElementEntityId,
            title: name,
            version,
            content: {
                id: `element_entity_test` as ElementEntityId,
                alarmGroupVehicles: {},
                name,
                triggerCount: 0,
                type: 'alarmGroup',
                triggerLimit: null,
            } as AlarmGroup,
            createdAt: new Date(),
            createdBy: 'test_user',
            description: 'Test element',
            stateVersion: 1,
        });

        beforeEach(() => {
            collectionElements = [
                createElementDto(1, 'A'),
                createElementDto(1, 'B'),
                createElementDto(1, 'C'),
            ];
        });

        it('should detect elements being added, updated and removed in the collection', () => {
            const addingElement = createElementDto(1, 'D');
            const updatingElement = createElementDto(2, 'B');
            const removedElement = collectionElements[0]!; // "A"

            const diff = environment.collectionService.getCollectionElementDiff(
                collectionElements,
                [
                    ...collectionElements
                        .filter((e) => e.entityId !== removedElement.entityId)
                        .map((e) =>
                            e.entityId === updatingElement.entityId
                                ? updatingElement
                                : e
                        ),
                    addingElement,
                ]
            );
            expect(diff.added).toEqual([addingElement]);
            expect(diff.removed).toEqual([removedElement]);
            expect(diff.updated).toEqual([
                {
                    old: collectionElements[1]!, // "B" version 1
                    new: updatingElement, // "B" version 2
                },
            ]);
        });
    });
});
