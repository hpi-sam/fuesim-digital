import { IsBoolean, IsInt, IsUUID } from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import {
    newMapPositionAt,
    getCreate,
    imagePropertiesSchema,
    IsPosition,
} from './utils/index.js';
import type {
    MapCoordinates,
    ImageProperties,
    Position,
} from './utils/index.js';

export class MapImage {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('mapImage' as const)
    public readonly type = 'mapImage';

    @IsUUID(4, uuidValidationOptions)
    public readonly templateId: UUID;

    /**
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @IsPosition()
    public readonly position: Position;

    @IsZodSchema(imagePropertiesSchema)
    public readonly image: ImageProperties;

    /**
     * Determines the rendering order among other mapImages.
     * A smaller number means the mapImage is behind another one.
     * The index can also be negative.
     * MapImages with the same zIndex don't have a defined order.
     */
    @IsInt()
    public readonly zIndex: number;

    /**
     * Whether the UI should prevent position changes of the map image by drag&drop
     */
    @IsBoolean()
    public readonly isLocked: boolean = false;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        templateId: UUID,
        topLeft: MapCoordinates,
        image: ImageProperties,
        isLocked: boolean,
        zIndex: number
    ) {
        this.templateId = templateId;
        this.position = newMapPositionAt(topLeft);
        this.image = image;
        this.isLocked = isLocked;
        this.zIndex = zIndex;
    }

    static readonly create = getCreate(this);
}
