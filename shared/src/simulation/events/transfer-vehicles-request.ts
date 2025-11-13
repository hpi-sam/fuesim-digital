import { IsOptional, IsString, IsUUID } from 'class-validator';
import { IsLiteralUnion, IsValue } from '../../utils/validators/index.js';
import type {
    ResourceDescription,
    ExerciseOccupation,
} from '../../models/index.js';
import { IsResourceDescription } from '../../utils/validators/is-resource-description.js';
import type { UUID } from '../../utils/index.js';
import { uuidValidationOptions } from '../../utils/index.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeAllowedValues } from '../utils/transfer-destination.js';
import { exerciseOccupationSchema, getCreate } from '../../models/index.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type { SimulationEvent } from './simulation-event.js';

export class TransferVehiclesRequestEvent implements SimulationEvent {
    @IsValue('transferVehiclesRequestEvent')
    readonly type = 'transferVehiclesRequestEvent';

    @IsResourceDescription()
    readonly requestedVehicles: ResourceDescription;

    @IsUUID(4, uuidValidationOptions)
    readonly transferInitiatingRegionId?: UUID;

    @IsLiteralUnion(transferDestinationTypeAllowedValues)
    readonly transferDestinationType: TransferDestination;

    @IsUUID(4, uuidValidationOptions)
    readonly transferDestinationId: UUID;

    @IsZodSchema(exerciseOccupationSchema.optional())
    readonly successorOccupation?: ExerciseOccupation;

    @IsOptional()
    @IsString()
    readonly key?: string;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        requestedVehicles: ResourceDescription,
        transferDestinationType: TransferDestination,
        transferDestinationId: UUID,
        transferInitiatingRegionId?: UUID,
        key?: string,
        successorOccupation?: ExerciseOccupation
    ) {
        this.requestedVehicles = requestedVehicles;
        this.transferInitiatingRegionId = transferInitiatingRegionId;
        this.transferDestinationType = transferDestinationType;
        this.transferDestinationId = transferDestinationId;
        this.key = key;
        this.successorOccupation = successorOccupation;
    }

    static readonly create = getCreate(this);
}
