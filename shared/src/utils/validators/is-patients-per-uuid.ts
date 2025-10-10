import type { ValidationOptions, ValidationArguments } from 'class-validator';
import { isUUID } from 'class-validator';
import type { UUID } from '../uuid.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import type { PatientStatus } from '../../models/utils/patient-status.js';
import { patientStatusAllowedValues } from '../../models/utils/patient-status.js';
import { createMapValidator } from './create-map-validator.js';
import type { GenericPropertyDecorator } from './generic-property-decorator.js';
import { makeValidator } from './make-validator.js';
import { isResourceDescription } from './is-resource-description.js';

export const isPatientsPerUUID = createMapValidator<
    UUID,
    ResourceDescription<PatientStatus>
>({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    keyValidator: <(key: unknown) => key is UUID>((key) => isUUID(key, 4)),
    valueValidator: (
        value: unknown
    ): value is ResourceDescription<PatientStatus> =>
        isResourceDescription(patientStatusAllowedValues, value),
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export function IsPatientsPerUUID<Each extends boolean = false>(
    validationOptions?: ValidationOptions & { each?: Each }
): GenericPropertyDecorator<
    { [key: UUID]: ResourceDescription<PatientStatus> },
    Each
> {
    return makeValidator<
        { [key: UUID]: ResourceDescription<PatientStatus> },
        Each
    >(
        'isPatientsPerUUID',
        (value: unknown, args?: ValidationArguments) =>
            isPatientsPerUUID(value),
        validationOptions
    );
}
