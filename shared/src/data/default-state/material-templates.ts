import type { MaterialTemplate } from '../../models/material-template.js';
import { newCanCaterFor } from '../../models/utils/cater-for.js';
import {
    defaultOverrideTreatmentRange,
    defaultTreatmentRange,
} from './default-treatment-range.js';

const standardMaterialTemplate: MaterialTemplate = {
    id: '900645f8-a9e0-491c-8a1b-b10ba3170168',
    type: 'materialTemplate',
    name: 'Standardmaterial',
    image: {
        url: '/assets/material.svg',
        height: 35,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(2, 0, 0, 'and'),
    overrideTreatmentRange: defaultOverrideTreatmentRange,
    treatmentRange: defaultTreatmentRange,
};

const bigMaterialTemplate: MaterialTemplate = {
    id: 'eb7f8e1f-95f5-4eef-b8e3-24a11b28c60a',
    type: 'materialTemplate',
    name: 'Erweitertes Material',
    image: {
        url: '/assets/big-material.svg',
        height: 35,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(2, 2, 0, 'and'),
    overrideTreatmentRange: defaultOverrideTreatmentRange,
    treatmentRange: 10,
};

export const defaultMaterialTemplates = {
    standard: standardMaterialTemplate,
    big: bigMaterialTemplate,
} as const;

export const defaultMaterialTemplatesById = Object.fromEntries(
    Object.values(defaultMaterialTemplates).map((template) => [
        template.id,
        template,
    ])
);
