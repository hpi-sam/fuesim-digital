import { jest } from '@jest/globals';
import { handleChanges } from './handle-changes';

describe('HandleChanges', () => {
    let oldDictionary: { readonly [key: string]: { readonly id: string } };
    const createHandler = jest.fn();
    const deleteHandler = jest.fn();
    const changeHandler = jest.fn();

    beforeEach(() => {
        oldDictionary = {
            a: { id: 'a' },
            b: { id: 'b' },
        };
        jest.clearAllMocks();
    });

    it('should not call any handler if the dictionaries are equal', () => {
        const newDictionary = oldDictionary;
        handleChanges(oldDictionary, newDictionary, {
            createHandler,
            deleteHandler,
            changeHandler,
        });
        expect(createHandler).not.toHaveBeenCalled();
        expect(deleteHandler).not.toHaveBeenCalled();
        expect(changeHandler).not.toHaveBeenCalled();
    });

    it('should correctly handle the addition of an element', () => {
        const newDictionary = { ...oldDictionary, c: { id: 'c' } };
        handleChanges(oldDictionary, newDictionary, {
            createHandler,
            deleteHandler,
            changeHandler,
        });
        expect(createHandler).toHaveBeenCalledWith({ id: 'c' });
        expect(deleteHandler).not.toHaveBeenCalled();
        expect(changeHandler).not.toHaveBeenCalled();
    });

    it('should correctly handle the deletion of an element', () => {
        const newDictionary = { a: oldDictionary['a']! };
        handleChanges(oldDictionary, newDictionary, {
            createHandler,
            deleteHandler,
            changeHandler,
        });
        expect(createHandler).not.toHaveBeenCalled();
        expect(deleteHandler).toHaveBeenCalledWith({ id: 'b' });
        expect(changeHandler).not.toHaveBeenCalled();
    });

    it('should correctly handle the change of an element', () => {
        const newDictionary = { ...oldDictionary, b: { id: 'bb' } };
        handleChanges(oldDictionary, newDictionary, {
            createHandler,
            deleteHandler,
            changeHandler,
        });
        expect(createHandler).not.toHaveBeenCalled();
        expect(deleteHandler).not.toHaveBeenCalled();
        expect(changeHandler).toHaveBeenCalledWith({ id: 'b' }, { id: 'bb' });
    });
});
