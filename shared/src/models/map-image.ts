import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsUUID, ValidateNested } from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import { IsPosition } from '../utils/validators/is-position.js';
import type { MapCoordinates, Position } from './utils/index.js';
import { MapPosition, getCreate, ImageProperties } from './utils/index.js';

export class MapImage {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('mapImage' as const)
    public readonly type = 'mapImage';

    /**
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @ValidateNested()
    @IsPosition()
    public readonly position: Position;

    @ValidateNested()
    @Type(() => ImageProperties)
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
        topLeft: MapCoordinates,
        image: ImageProperties,
        isLocked: boolean,
        zIndex: number
    ) {
        this.position = MapPosition.create(topLeft);
        this.image = image;
        this.isLocked = isLocked;
        this.zIndex = zIndex;
    }

    static readonly create = getCreate(this);
}
