import { trackByPropertyPipeTransform } from './track-by-property-pipe-transform';

describe('AppTrackByPropertyPipe', () => {
    it('returns a function', () => {
        expect(typeof trackByPropertyPipeTransform('$index')).toBe('function');
        expect(typeof trackByPropertyPipeTransform('$value')).toBe('function');
        expect(typeof trackByPropertyPipeTransform('id')).toBe('function');
        expect(typeof trackByPropertyPipeTransform('user.id')).toBe('function');
        expect(
            typeof trackByPropertyPipeTransform(['user.name', 'user.surname'])
        ).toBe('function');
    });

    it('returns a function that tracks by the array index', () => {
        const compareFn = trackByPropertyPipeTransform('$index');
        expect(compareFn(1, 1)).toBe(1);
        expect(compareFn(2, { a: 1 })).toBe(2);
        expect(compareFn(5, {})).toBe(5);
    });

    it('returns a function that tracks by the specified property', () => {
        const compareFn = trackByPropertyPipeTransform('id');
        expect(compareFn(1, { id: 4, a: 'a' })).toBe(4);
        expect(compareFn(2, { id: 1, a: 'b' })).toBe(1);
        expect(compareFn(3, { id: 42, a: 'c' })).toBe(42);
    });

    it('returns a function that tracks by the specified property path', () => {
        const compareFn = trackByPropertyPipeTransform('user.id');
        expect(compareFn(1, { user: { id: 4 }, a: 'a' })).toBe(4);
        expect(compareFn(2, { user: { id: 1 }, a: 'b' })).toBe(1);
        expect(compareFn(3, { user: { id: 42 }, a: 'c' })).toBe(42);
    });

    it('returns a function that tracks by the item value (primitive)', () => {
        const compareFn = trackByPropertyPipeTransform('$value');
        expect(compareFn(1, 1)).toBe(1);
        expect(compareFn(1, 2)).toBe(2);
        expect(compareFn(2, '')).toBe('');
        expect(compareFn(2, 'a')).toBe('a');
        expect(compareFn(2, 'aaabbb')).toBe('aaabbb');
        expect(compareFn(5, true)).toBe(true);
        expect(compareFn(5, false)).toBe(false);
        expect(compareFn(5, null)).toBe(null);
        expect(compareFn(5, undefined)).toBe(undefined);
    });

    it('returns a function that tracks by the item value (object)', () => {
        const compareFn = trackByPropertyPipeTransform('$value');
        expect(compareFn(1, { user: { id: 4 }, a: 'a' })).toEqual(
            compareFn(3, { a: 'a', user: { id: 4 } })
        );
        expect(compareFn(2, { a: [1, 2, 3] })).toEqual(
            compareFn(2, { a: [1, 2, 3] })
        );
        expect(compareFn(2, {})).toEqual(compareFn(2, {}));
        expect(compareFn(2, { a: [1, 2, 3, 4] })).not.toEqual(
            compareFn(2, { a: [1, 2, 3] })
        );
        expect(compareFn(2, { a: [1, 2, 3], b: 2 })).not.toEqual(
            compareFn(2, { a: [1, 2, 3] })
        );
        expect(compareFn(2, { a: [1, 2, 3], b: 2 })).not.toEqual(
            compareFn(2, '{ a: [1, 2, 3], b: 2 }')
        );
    });

    it('returns a function that tracks by the item value and does not confuse strings with objects', () => {
        const compareFn = trackByPropertyPipeTransform('$value');
        expect(compareFn(2, { a: [1, 2, 3], b: 2 })).not.toEqual(
            compareFn(2, '{ a: [1, 2, 3], b: 2 }')
        );
        expect(compareFn(2, {})).not.toEqual(compareFn(2, JSON.stringify({})));
        expect(compareFn(2, [])).not.toEqual(compareFn(2, JSON.stringify([])));
    });

    it('returns a function that tracks by the value (arrays)', () => {
        const compareFn = trackByPropertyPipeTransform('$value');
        expect(compareFn(2, [])).toEqual(compareFn(2, []));
        expect(compareFn(2, [1, 2, 3])).toEqual(compareFn(3, [1, 2, 3]));
        expect(compareFn(2, [1])).not.toEqual(compareFn(2, []));
        expect(compareFn(2, [1, 2, 3])).not.toEqual(compareFn(2, [3, 2, 1]));
    });

    it('returns a function that tracks by multiple paths', () => {
        const compareFn = trackByPropertyPipeTransform(
            ['name', 'surname'],
            [] as { id: number; name: string; surname: string }[]
        );
        expect(compareFn(1, { id: 1, name: 'John', surname: 'Smith' })).toEqual(
            compareFn(3, { id: 2, name: 'John', surname: 'Smith' })
        );
        expect(
            compareFn(1, { id: 1, name: 'John1', surname: 'Smith' })
        ).not.toEqual(compareFn(3, { id: 2, name: 'John', surname: 'Smith' }));
        expect(
            compareFn(1, { id: 1, name: 'John', surname: 'SmIth' })
        ).not.toEqual(compareFn(3, { id: 2, name: 'John', surname: 'Smith' }));
    });

    it('provides typesafety for the parameters', () => {
        trackByPropertyPipeTransform('a.b.c');
        trackByPropertyPipeTransform('$value', [] as number[]);
        trackByPropertyPipeTransform('$value', [] as (number | string)[]);
        trackByPropertyPipeTransform('$index', [] as (number | string)[]);
        trackByPropertyPipeTransform(
            ['name', 'surname'],
            [] as { id: number; name: string; surname: string }[]
        );
        trackByPropertyPipeTransform(
            'name',
            [] as { id: number; name: string; surname: string }[]
        );
        trackByPropertyPipeTransform(
            'user.name',
            [] as { user: { id: number; name: string; surname: string } }[]
        );
        trackByPropertyPipeTransform(
            ['user.name', 'user.surname'],
            [] as { user: { id: number; name: string; surname: string } }[]
        );

        // @ts-expect-error - this is a typing test
        trackByPropertyPipeTransform('$ndex', [] as (number | string)[]);
        // @ts-expect-error - this is a typing test
        trackByPropertyPipeTransform(['$index'], [] as (number | string)[]);
        // @ts-expect-error - this is a typing test
        trackByPropertyPipeTransform(['$value'], [] as (number | string)[]);
        // @ts-expect-error - this is a typing test
        trackByPropertyPipeTransform(['property'], [] as (number | string)[]);
        trackByPropertyPipeTransform(
            // @ts-expect-error - this is a typing test
            'u',
            [] as { user: { id: number; name: string; surname: string } }[]
        );
        trackByPropertyPipeTransform(
            // @ts-expect-error - this is a typing test
            ['name', 'n'],
            [] as { id: number; name: string; surname: string }[]
        );
    });
});
