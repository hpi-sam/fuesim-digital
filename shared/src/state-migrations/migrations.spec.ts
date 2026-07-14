import { range } from 'lodash-es';
import { currentStateVersion } from '../state.js';
import { migrations } from './migration-functions.js';

describe('migrations definition', () => {
    it('has the correct versions', () => {
        const expectKeys = range(2, currentStateVersion + 1).map((number) =>
            number.toString()
        );
        expect(Object.keys(migrations)).toStrictEqual(expectKeys);
    });
});
