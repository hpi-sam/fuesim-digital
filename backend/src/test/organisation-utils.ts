import type { PostOrganisationRequestData } from 'fuesim-digital-shared';
import { getOrganisationResponseDataSchema } from 'fuesim-digital-shared';
import type { TestEnvironment } from './utils.js';

export async function createOrganisation(
    environment: TestEnvironment,
    session: string
) {
    const response = await environment
        .httpRequest('post', '/api/organisations/', session)
        .send({
            name: 'Test Organisation',
            description: '',
        } satisfies PostOrganisationRequestData)
        .expect(201);

    return getOrganisationResponseDataSchema.parse(response.body);
}
