import { generateChangedProperties } from './generate-changed-properties';

describe('GenerateChangedProperties', () => {
    it('should generate the right properties if the objects are different', () => {
        expect(
            generateChangedProperties({ a: 0, b: 0 }, { a: 0, b: 1 })
        ).toEqual(new Set(['b']));
        expect(
            generateChangedProperties({ a: 1, b: 0 }, { a: 0, b: 1 })
        ).toEqual(new Set(['a', 'b']));
    });

    it('should generate the right properties if the objects are equal', () => {
        expect(
            generateChangedProperties({ a: 0, b: 0 }, { a: 0, b: 0 })
        ).toEqual(new Set([]));
    });

    it('should correctly handle optional properties', () => {
        expect(generateChangedProperties({ a: 0 }, { a: 0, b: 1 })).toEqual(
            new Set(['b'])
        );
        expect(generateChangedProperties<{ b?: number }>({}, {})).toEqual(
            new Set([])
        );
        expect(
            generateChangedProperties<{ b?: number }>({ b: undefined }, {})
        ).toEqual(new Set([]));
    });

    it('should make deep comparisons', () => {
        const oldElement = { a: { a: 1 }, b: 0 };
        const newElement = { a: { a: 1 }, b: 0 };
        expect(generateChangedProperties(oldElement, newElement)).toEqual(
            new Set([])
        );
        const anObject = { a: 1 };
        expect(
            generateChangedProperties(
                { a: anObject, b: 0 },
                { a: anObject, b: 0 }
            )
        ).toEqual(new Set([]));
    });
});
