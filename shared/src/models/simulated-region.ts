import { Type } from 'class-transformer';
import { IsString, IsUUID, ValidateNested } from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsMultiTypedIdMap, IsValue } from '../utils/validators/index.js';
import type {
    ExerciseSimulationEvent,
    ExerciseSimulationActivityState,
    ExerciseSimulationBehaviorState,
} from '../simulation/index.js';
import {
    simulationEventTypeOptions,
    getSimulationActivityConstructor,
    simulationBehaviorTypeOptions,
} from '../simulation/index.js';
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import {
    newMapPositionAt,
    ImageProperties,
    MapCoordinates,
    getCreate,
    IsPosition,
    sizeSchema,
} from './utils/index.js';
import type { Position, Size } from './utils/index.js';

export class SimulatedRegion {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('simulatedRegion' as const)
    public readonly type = 'simulatedRegion';

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

    @IsString()
    public readonly borderColor: string;

    @Type(...simulationEventTypeOptions)
    @ValidateNested()
    public readonly inEvents: readonly ExerciseSimulationEvent[] = [];

    @Type(...simulationBehaviorTypeOptions)
    @ValidateNested()
    public readonly behaviors: readonly ExerciseSimulationBehaviorState[] = [];

    @IsMultiTypedIdMap(getSimulationActivityConstructor)
    @ValidateNested()
    public readonly activities: {
        readonly [stateId: UUID]: ExerciseSimulationActivityState;
    } = {};

    /**
     * @param position top-left position
     * @deprecated Use {@link create} instead
     */
    constructor(
        position: MapCoordinates,
        size: Size,
        name: string,
        borderColor: string = '#cccc00'
    ) {
        this.position = newMapPositionAt(position);
        this.size = size;
        this.name = name;
        this.borderColor = borderColor;
    }

    static readonly create = getCreate(this);

    static image: ImageProperties = {
        url: 'assets/simulated-region.svg',
        height: 1800,
        aspectRatio: 1600 / 900,
    };
}
