import {
    AlarmGroup,
    ElementDto,
    ElementEntityId,
    ElementVersionId,
} from 'fuesim-digital-shared';
import { createTestEnvironment } from '../../test/utils.js';

describe('Collection Repository', () => {
    const environment = createTestEnvironment();

    it('transactions do not leak data', async () => {
        const colA =
            await environment.collectionRepository.createFirstCollectionVersion(
                'collection1',
                'test_user'
            );
        const colB =
            await environment.collectionRepository.createFirstCollectionVersion(
                'collection2',
                'test_user'
            );

        expect(colA).toBeDefined();
        expect(colB).toBeDefined();
        if (!colA || !colB) return;

        // The double transaction is basically a stress-test,
        // bc this failed often times
        await environment.collectionService.transaction(async (tx1) => {
            await tx1.transaction(async (tx2) => {
                await tx2[
                    'collectionRepository'
                ].addCollectionVersionDependency(
                    colA.versionId,
                    colB.versionId
                );
            });

            const directDeps_colA =
                await environment.collectionRepository.getCollectionVersionDirectDependencies(
                    colA.versionId
                );
            expect(directDeps_colA).toHaveLength(0);
        });

        const directDeps_colA =
            await environment.collectionRepository.getCollectionVersionDirectDependencies(
                colA.versionId
            );
        expect(directDeps_colA).toHaveLength(1);
        expect(directDeps_colA[0]!.collectionVersionId).toBe(colB.versionId);
    });
});
