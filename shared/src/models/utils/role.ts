import { z } from 'zod';

export const roleAllowedValues = ['participant', 'trainer'] as const;
export const roleSchema = z.literal(roleAllowedValues);
export type Role = z.infer<typeof roleSchema>;

export const specificRoleAllowedValues = [
    'mapOperator',
    'eoc',
    'trainer',
    'operationsTablet',
] as const;
export const specificRoleSchema = z.literal(specificRoleAllowedValues);
export type SpecificRole = z.infer<typeof specificRoleSchema>;

export const specificRoleDisplayNames: { [key in SpecificRole]: string } = {
    eoc: 'Leitstelle',
    mapOperator: 'Kartenansicht',
    trainer: 'Trainer',
    operationsTablet: 'Einsatzübersicht',
} as const;
export function getSpecificRoleDisplayName(specificRole: SpecificRole): string {
    return specificRoleDisplayNames[specificRole];
}
