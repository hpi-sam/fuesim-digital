import { newViewport } from '../models/index.js';
import type { MapCoordinates } from '../models/utils/index.js';
import type { ExerciseAction } from './action-reducers/index.js';
import { validateExerciseAction } from './index.js';

describe('validateExerciseAction', () => {
    it('should accept a valid action object', () => {
        expect(
            validateExerciseAction({
                type: '[Viewport] Remove viewport',
                viewportId: 'b02c7756-ea52-427f-9fc3-0e163799544d',
            })
        ).toEqual([]);
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
        ).toEqual([]);
    });

    it("should reject everything that isn't an action object", () => {
        expect(validateExerciseAction(2 as any)).not.toEqual([]);
        expect(validateExerciseAction(true as any)).not.toEqual([]);
        expect(validateExerciseAction(Error('anything') as any)).not.toEqual(
            []
        );
        expect(validateExerciseAction({} as any)).not.toEqual([]);
        expect(validateExerciseAction([] as any)).not.toEqual([]);
    });

    it('should reject an action object with an invalid type', () => {
        expect(validateExerciseAction({ type: 'a' } as any)).not.toEqual([]);
        expect(
            // there is a typo in the type
            validateExerciseAction({ type: '[Viewport] AddViewport' } as any)
        ).not.toEqual([]);
    });

    it('should reject an invalid action object', () => {
        expect(
            validateExerciseAction({
                type: '[Viewport] Remove viewport',
                // missing viewportId
            } as ExerciseAction)
        ).toEqual([
            {
                target: {
                    type: '[Viewport] Remove viewport',
                    viewportId: undefined,
                },
                value: undefined,
                property: 'viewportId',
                children: [],
                constraints: { isUuid: "Got malformed id: 'undefined'." },
            },
        ]);

        expect(
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
        ).not.toEqual([]);
    });

    it('should reject an otherwise valid action object with additional fields', () => {
        // on the top level
        expect(
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
        ).not.toEqual([]);
        // down in the structure
        expect(
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
        ).not.toEqual([]);
    });
});
