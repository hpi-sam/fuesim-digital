import type { AllowedValues } from '../../utils/validators/index.js';

export type Role = 'participant' | 'trainer';
export const roleAllowedValues: AllowedValues<Role> = {
    participant: true,
    trainer: true,
};
export type SpecificRole = 'eoc' | 'map-operator' | 'trainer';
export const specificRolesAllowedValues: AllowedValues<SpecificRole> = {
    'map-operator': true,
    eoc: true,
    trainer: true,
};
