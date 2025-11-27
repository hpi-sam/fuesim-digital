import { hashString } from './hash-string';

describe('hashString', () => {
    it('creates the same hash for the same input', () => {
        expect(hashString('a')).toBe(hashString('a'));
        expect(hashString('')).toBe(hashString(''));
        expect(hashString('ab'.repeat(100))).toBe(hashString('ab'.repeat(100)));
    });

    it('creates a different hash for a different input', () => {
        expect(hashString('a')).not.toBe(hashString('b'));
        expect(hashString('a'.repeat(1000))).not.toBe(
            hashString(`${'a'.repeat(999)}b`)
        );
    });

    it('reduces the length of very long inputs', () => {
        const longString = 'a'.repeat(5000);
        expect(hashString(longString).length).toBeLessThan(50);
    });

    it('works for stringified objects', () => {
        const anObject = {
            a: 1,
            b: 2,
            c: { a: [1, 2, 3, 4], d: true, e: 'a' },
        };
        expect(typeof hashString(JSON.stringify(anObject))).toBe('string');
    });
});
