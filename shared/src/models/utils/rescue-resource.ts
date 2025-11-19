import type { Type } from 'class-transformer';
import { StrictObject } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import { IsResourceDescription } from '../../utils/validators/is-resource-description.js';
import { getCreate } from './get-create.js';
import type { ResourceDescription } from './resource-description.js';

class RescueResource {
    public readonly type!: `${string}Resource`;
}

export class VehicleResource {
    @IsValue('vehicleResource' as const)
    public readonly type = 'vehicleResource';

    @IsResourceDescription()
    public readonly vehicleCounts: ResourceDescription;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(vehicleCounts: ResourceDescription) {
        this.vehicleCounts = vehicleCounts;
    }

    static readonly create = getCreate(this);
}

export class PersonnelResource {
    @IsValue('personnelResource' as const)
    public readonly type = 'personnelResource';

    @IsResourceDescription()
    public readonly personnelCounts: ResourceDescription;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(personnelCounts?: ResourceDescription) {
        this.personnelCounts = personnelCounts ?? {};
    }

    static readonly create = getCreate(this);
}

export type ExerciseRescueResource = PersonnelResource | VehicleResource;

export const rescueResourceTypeOptions: Parameters<typeof Type> = [
    () => RescueResource,
    {
        keepDiscriminatorProperty: true,
        discriminator: {
            property: 'type',
            subTypes: [
                { name: 'vehicleResource', value: VehicleResource },
                { name: 'personnelResource', value: PersonnelResource },
            ],
        },
    },
];

export function isEmptyResource(resource: ExerciseRescueResource) {
    let resourceDescription: ResourceDescription;
    switch (resource.type) {
        case 'personnelResource':
            resourceDescription = resource.personnelCounts;
            break;
        case 'vehicleResource':
            resourceDescription = resource.vehicleCounts;
            break;
    }
    return StrictObject.values(resourceDescription).every(
        (count) => count === 0
    );
}
