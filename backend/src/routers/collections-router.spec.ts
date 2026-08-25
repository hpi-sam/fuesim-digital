// eslint-disable-next-line import-x/no-named-as-default
import sharp from 'sharp';
import type { InferSelectModel } from 'drizzle-orm';
import type { UploadedImageUploadInput } from 'fuesim-digital-shared';
import { Marketplace, uuid } from 'fuesim-digital-shared';
import {
    createTestEnvironment,
    createTestUserSession,
    defaultTestUserSessionData,
} from '../test/utils.js';
import type { collectionTable, OrganisationEntry } from '../database/schema.js';
import { Config } from '../config.js';

describe('collections router', () => {
    const environment = createTestEnvironment();
    let session: string;
    let personalOrganisation: OrganisationEntry;
    let collection: InferSelectModel<typeof collectionTable>;

    beforeEach(async () => {
        session = await createTestUserSession(environment);
        personalOrganisation =
            await environment.services.organisationService.ensurePersonalOrganisation(
                defaultTestUserSessionData
            );
        collection =
            await environment.services.collectionService.createCollection(
                'test',
                personalOrganisation.id
            );
    });

    const baseTestImage = sharp({
        create: {
            width: 48,
            height: 48,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 },
        },
    });
    const testImages = {
        png: baseTestImage.png().toBuffer(),
        jpg: baseTestImage.jpeg().toBuffer(),
        svg: Buffer.from(
            '<svg><rect x="0" y="0" width="200" height="200" rx="50" ry="50"/></svg>'
        ),
    };
    const testElement: Omit<UploadedImageUploadInput, 'file'> & {
        file: undefined;
    } = {
        id: uuid(),
        type: 'uploadedImage',
        name: 'Test Image',
        file: undefined,
    };

    function uploadImage(testImage: Buffer<ArrayBuffer>) {
        return environment
            .httpRequest(
                'post',
                `/api/collections/${collection.entityId}/upload`,
                session
            )
            .send(
                Marketplace.Element.UploadImage.requestSchema.encode({
                    data: { ...testElement, file: testImage },
                })
            );
    }

    describe('POST /api/collections/:collectionEntityId/upload', () => {
        it.each(Object.entries(testImages))(
            'successfully upload %s image',
            async (_, testImage) => {
                const response = await uploadImage(await testImage).expect(200);
                const data =
                    Marketplace.Element.UploadImage.responseSchema.parse(
                        response.body
                    );
                expect(data.result.length).toBe(1);
                const createdElement = data.result[0]!;
                expect(createdElement.content.type).toBe('uploadedImage');
                if (createdElement.content.type !== 'uploadedImage') return;
                expect(createdElement.content.name).toBe(testElement.name);
                expect(createdElement.content.secret.length).toBe(64);
                expect(createdElement.content.aspectRatio).toBe(1);
            }
        );

        it('fails if no valid image', async () => {
            const testImage = await baseTestImage.png().toBuffer();
            testImage.write('corrupt');
            const response = await uploadImage(testImage).expect(400);
            expect(response.body.message).toBe('Das Bild ist kaputt.');
        });

        it('fails if no supported image type', async () => {
            const buffer = await baseTestImage.gif().toBuffer();
            const response = await uploadImage(buffer).expect(400);
            expect(response.body.message).toBe(
                'Das Bild hat einen ungültigen Dateityp: image/gif. Die akzeptierten Dateitypen sind: image/png, image/jpeg, image/svg+xml, image/webp.'
            );
        });

        it('fails if image too large', async () => {
            const testImage = await sharp({
                create: {
                    width: Config.imageUploadLimit,
                    height: Config.imageUploadLimit,
                    channels: 4,
                    background: { r: 255, g: 0, b: 0, alpha: 0.5 },
                },
            })
                .png()
                .toBuffer();
            expect(testImage.length).toBeGreaterThan(Config.imageUploadLimit);
            const response = await uploadImage(testImage).expect(400);
            expect(response.body.message).toBe(
                'Das Bild ist zu groß. Die maximal erlaubte Dateigröße beträgt 500 B.'
            );
        });
    });

    describe('GET /api/collections/image/:elementVersionId', () => {
        it.each(Object.entries(testImages))(
            'successfully fetch uploaded %s image',
            async (_, testImage) => {
                const buffer = await testImage;
                const response = await uploadImage(buffer).expect(200);

                const data =
                    Marketplace.Element.UploadImage.responseSchema.parse(
                        response.body
                    ).result[0]!;
                if (data.content.type !== 'uploadedImage') return;

                await environment
                    .httpRequest('get', `/api/collections/image/${uuid()}`)
                    .expect(403);
                await environment
                    .httpRequest(
                        'get',
                        `/api/collections/image/${data.versionId}`
                    )
                    .expect(403);
                await environment
                    .httpRequest(
                        'get',
                        `/api/collections/image/${data.versionId}?secret=random_secret`
                    )
                    .expect(403);

                const response2 = await environment
                    .httpRequest(
                        'get',
                        `/api/collections/image/${data.versionId}?secret=${data.content.secret}`
                    )
                    .expect(200);
                expect(response2.body).toEqual(buffer);
            }
        );
    });
});
