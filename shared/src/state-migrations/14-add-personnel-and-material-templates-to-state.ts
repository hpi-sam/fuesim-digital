import { cloneDeepMutable } from '../utils/clone-deep.js';
import type { Migration } from './migration-functions.js';

export const addPersonnelAndMaterialToState14: Migration = {
    action: null,
    state: (state: any) => {
        state.materialTemplates = cloneDeepMutable(defaultMaterialTemplates);
        state.personnelTemplates = cloneDeepMutable(defaultPersonnelTemplates);
    },
};

const defaultMaterialTemplates = {
    standard: {
        materialType: 'standard',
        canCaterFor: {
            red: 2,
            yellow: 0,
            green: 0,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 2.5,
        treatmentRange: 5.5,
        image: {
            url: '/assets/material.svg',
            height: 40,
            aspectRatio: 1,
        },
    },
    big: {
        materialType: 'big',
        canCaterFor: {
            red: 2,
            yellow: 2,
            green: 0,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 2.5,
        treatmentRange: 10,
        image: {
            url: '/assets/material.svg',
            height: 56,
            aspectRatio: 1,
        },
    },
};

const defaultPersonnelTemplates = {
    san: {
        personnelType: 'san',
        canCaterFor: {
            red: 0,
            yellow: 0,
            green: 5,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 2.5,
        treatmentRange: 5.5,
        image: {
            url: '/assets/san-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
    },
    rettSan: {
        personnelType: 'rettSan',
        canCaterFor: {
            red: 1,
            yellow: 2,
            green: 0,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 2.5,
        treatmentRange: 5.5,
        image: {
            url: '/assets/rettSan-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
    },
    notSan: {
        personnelType: 'notSan',
        canCaterFor: {
            red: 2,
            yellow: 1,
            green: 0,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 2.5,
        treatmentRange: 5.5,
        image: {
            url: '/assets/notSan-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
    },
    notarzt: {
        personnelType: 'notarzt',
        canCaterFor: {
            red: 2,
            yellow: 2,
            green: 2,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 2.5,
        treatmentRange: 15,
        image: {
            url: '/assets/notarzt-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
    },
    gf: {
        personnelType: 'gf',
        canCaterFor: {
            red: 0,
            yellow: 0,
            green: 0,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 0,
        treatmentRange: 0,
        image: {
            url: '/assets/gf-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
    },
};
