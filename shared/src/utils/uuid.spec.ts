import { z } from 'zod';
import { getIdMapSchema, uuidSchema } from './uuid.js';

describe('getIsIdMapSchema', () => {
    it('should succeed if ids match', () => {
        const result = getIdMapSchema(
            z.object({ id: uuidSchema, name: z.string() })
        ).safeParse({
            '6c0bdcf7-3cfc-4bb6-b898-c8a6085e7a50': {
                id: '6c0bdcf7-3cfc-4bb6-b898-c8a6085e7a50',
                name: 'Test',
            },
        });
        expect(result.success).toBeTrue();
    });
    it("should fail if ids don't match", () => {
        const result = getIdMapSchema(
            z.object({ id: uuidSchema, name: z.string() })
        ).safeParse({
            '1c69d1da-3051-4342-a804-f489adcd09e4': {
                id: '6c0bdcf7-3cfc-4bb6-b898-c8a6085e7a50',
                name: 'Test',
            },
        });
        expect(result.success).toBeFalse();
    });
});
