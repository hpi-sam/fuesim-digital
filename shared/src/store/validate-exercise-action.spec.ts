import { ZodError } from 'zod';
import type { MapCoordinates } from '../models/utils/position/map-coordinates.js';
import { newViewport } from '../models/viewport.js';
import { validateExerciseAction } from './validate-exercise-action.js';
import type { ExerciseAction } from './action-reducers/action-reducers.js';

describe('validateExerciseAction', () => {
    it('should accept a valid action object', () => {
        expect(
            validateExerciseAction({
                type: '[Viewport] Remove viewport',
                viewportId: 'b02c7756-ea52-427f-9fc3-0e163799544d',
            })
        ).toBeDefined();
        expect(
            validateExerciseAction({
                type: '[Viewport] Add viewport',
                viewport: newViewport(
                    {
                        x: 0,
                        y: 0,
                    },
                    ''
                ),
            })
        ).toBeDefined();
    });

    it("should reject everything that isn't an action object", () => {
        expect(() => validateExerciseAction(2 as any)).toThrow();
        expect(() => validateExerciseAction(true as any)).toThrow();
        expect(() =>
            validateExerciseAction(Error('anything') as any)
        ).toThrow();
        expect(() => validateExerciseAction({} as any)).toThrow();
        expect(() => validateExerciseAction([] as any)).toThrow();
    });

    it('should reject an action object with an invalid type', () => {
        expect(() => validateExerciseAction({ type: 'a' } as any)).toThrow();
        expect(
            // there is a typo in the type
            () =>
                validateExerciseAction({
                    type: '[Viewport] AddViewport',
                } as any)
        ).toThrow(ZodError);
    });

    it('should reject an invalid action object', () => {
        expect(() =>
            validateExerciseAction({
                type: '[Viewport] Remove viewport',
                // missing viewportId
            } as ExerciseAction)
        ).toThrow();

        expect(() =>
            validateExerciseAction({
                type: '[Viewport] Add viewport',
                viewport: {
                    id: 'b02c7756-ea52-427f-9fc3-0e163799544d',
                    type: 'viewport',
                    name: '',
                    size: {
                        height: 1,
                        width: 1,
                    },
                    position: {
                        type: 'coordinates',
                        coordinates: {
                            // this is of type string instead of number
                            x: '0' as unknown as number,
                            y: 0,
                        },
                    },
                },
            })
        ).toThrow();
    });

    it('should reject an otherwise valid action object with additional fields', () => {
        // on the top level
        expect(() =>
            validateExerciseAction({
                type: '[Viewport] Add viewport',
                viewport: {
                    id: 'b02c7756-ea52-427f-9fc3-0e163799544d',
                    name: '',
                    size: {
                        height: 1,
                        width: 1,
                    },
                    topLeft: {
                        x: 0,
                        y: 0,
                    },
                },
                someKey: 'someValue',
            } as unknown as ExerciseAction)
        ).toThrow();
        // down in the structure
        expect(() =>
            validateExerciseAction({
                type: '[Viewport] Add viewport',
                viewport: {
                    id: 'b02c7756-ea52-427f-9fc3-0e163799544d',
                    type: 'viewport',
                    name: '',
                    size: {
                        height: 1,
                        width: 1,
                    },
                    position: {
                        type: 'coordinates',
                        coordinates: {
                            x: 0,
                            y: 0,
                            z: 0,
                        } as unknown as MapCoordinates,
                    },
                },
            })
        ).toThrow();
    });
});
