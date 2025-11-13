import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { Material } from '../material.js';
import { Personnel } from '../personnel.js';
import { vehicleSchema } from '../vehicle.js';
import type { Vehicle } from '../vehicle.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { getCreate } from './get-create.js';

export class VehicleParameters {
    @IsZodSchema(vehicleSchema)
    public readonly vehicle!: Vehicle;

    @IsArray()
    @ValidateNested()
    @Type(() => Material)
    public readonly materials!: readonly Material[];

    @IsArray()
    @ValidateNested()
    @Type(() => Personnel)
    public readonly personnel!: readonly Personnel[];

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        vehicle: Vehicle,
        materials: Material[],
        personnel: Personnel[]
    ) {
        this.vehicle = vehicle;
        this.materials = materials;
        this.personnel = personnel;
    }

    static readonly create = getCreate(this);
}
