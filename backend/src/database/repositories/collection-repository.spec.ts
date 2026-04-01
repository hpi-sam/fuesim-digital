import { createTestEnvironment } from '../../test/utils.js';

describe('Collection Repository', () => {
    const environment = createTestEnvironment();

    it('transactions do not leak data', async () => {
        const colA =
            await environment.collectionRepository.createFirstCollectionVersion(
                'collection1'
            );
        const colB =
            await environment.collectionRepository.createFirstCollectionVersion(
                'collection2'
            );

        expect(colA).toBeDefined();
        expect(colB).toBeDefined();

        // The double transaction is basically a stress-test,
        // bc this failed often times
        await environment.collectionService.transaction(async (tx1) => {
            await tx1.transaction(async (tx2) => {
                await tx2.collectionRepository.addCollectionVersionDependency(
                    colA.versionId,
                    colB.versionId
                );
            });

            const directDepsColA =
                await environment.collectionRepository.getCollectionVersionDirectDependencies(
                    colA.versionId
                );
            expect(directDepsColA).toHaveLength(0);
        });

        const directDepsColA =
            await environment.collectionRepository.getCollectionVersionDirectDependencies(
                colA.versionId
            );
        expect(directDepsColA).toHaveLength(1);
        expect(directDepsColA[0]!.collectionVersionId).toBe(colB.versionId);
    });
});
