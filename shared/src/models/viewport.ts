import { IsString, IsUUID } from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import {
    IsPosition,
    getCreate,
    lowerRightCornerOf,
    upperLeftCornerOf,
    newMapPositionAt,
    sizeSchema,
} from './utils/index.js';
import type {
    Position,
    ImageProperties,
    MapCoordinates,
    Size,
} from './utils/index.js';

export class Viewport {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('viewport' as const)
    public readonly type = 'viewport';

    /**
     * top-left position
     *
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @IsPosition()
    public readonly position: Position;

    @IsZodSchema(sizeSchema)
    public readonly size: Size;

    @IsString()
    public readonly name: string;

    /**
     * @param position top-left position
     * @deprecated Use {@link create} instead
     */
    constructor(position: MapCoordinates, size: Size, name: string) {
        this.position = newMapPositionAt(position);
        this.size = size;
        this.name = name;
    }

    static readonly create = getCreate(this);

    static image: ImageProperties = {
        url: 'assets/viewport.svg',
        height: 1800,
        aspectRatio: 1600 / 900,
    };

    static isInViewport(viewport: Viewport, position: MapCoordinates): boolean {
        const upperLeftCorner = upperLeftCornerOf(viewport);
        const lowerRightCorner = lowerRightCornerOf(viewport);
        return (
            upperLeftCorner.x <= position.x &&
            position.x <= lowerRightCorner.x &&
            lowerRightCorner.y <= position.y &&
            position.y <= upperLeftCorner.y
        );
    }
}
