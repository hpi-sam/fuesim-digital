import type { AllowedValues } from '../../utils/validators/index.js';

export type Role = 'participant' | 'trainer';
export const roleAllowedValues: AllowedValues<Role> = {
    participant: true,
    trainer: true,
};
export type SpecificRole = 'eoc' | 'mapOperator' | 'trainer';
export const specificRoleAllowedValues: AllowedValues<SpecificRole> = {
    mapOperator: true,
    eoc: true,
    trainer: true,
};
