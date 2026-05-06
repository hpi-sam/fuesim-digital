import type { PersonnelTemplate } from '../../models/personnel-template.js';
import { newCanCaterFor } from '../../models/utils/cater-for.js';
import { cloneDeepImmutable } from '../../utils/clone-deep.js';
import {
    defaultOverrideTreatmentRange,
    defaultTreatmentRange,
} from './default-treatment-range.js';

const sanPersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: '21b42fa5-2194-4efe-bc22-b525854a0495',
    type: 'personnelTemplate',
    personnelType: 'san',
    name: 'Sanitäter',
    image: {
        url: '/assets/san-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(0, 0, 5, 'and'),
    overrideTreatmentRange: defaultOverrideTreatmentRange,
    treatmentRange: defaultTreatmentRange,
    abbreviation: 'San',
});

const rettSanPersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: '1295a150-e985-431e-bab9-0c06a0bd24a1',
    type: 'personnelTemplate',
    personnelType: 'rettSan',
    name: 'Rettungssanitäter',
    image: {
        url: '/assets/rettSan-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(1, 2, 0, 'and'),
    overrideTreatmentRange: defaultOverrideTreatmentRange,
    treatmentRange: defaultTreatmentRange,
    abbreviation: 'RS',
});

const notSanPersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: '1cbd045b-3133-44d6-9f88-d4d5a571b83f',
    type: 'personnelTemplate',
    personnelType: 'notSan',
    name: 'Notfallsanitäter',
    image: {
        url: '/assets/notSan-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(2, 1, 0, 'and'),
    overrideTreatmentRange: defaultOverrideTreatmentRange,
    treatmentRange: defaultTreatmentRange,
    abbreviation: 'NFS',
});

const notarztPersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: 'd8f128d2-2532-4ac1-8439-d79aed4ed994',
    type: 'personnelTemplate',
    personnelType: 'notarzt',
    name: 'Notarzt',
    image: {
        url: '/assets/notarzt-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(2, 2, 2, 'and'),
    overrideTreatmentRange: defaultOverrideTreatmentRange,
    treatmentRange: 15,
    abbreviation: 'NA',
});

const gfPersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: '4f02b429-2f9e-42c3-b844-be760565cd31',
    type: 'personnelTemplate',
    personnelType: 'gf',
    name: 'Gruppenführer',
    image: {
        url: '/assets/gf-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(0, 0, 0, 'and'),
    overrideTreatmentRange: 0,
    treatmentRange: 0,
    abbreviation: 'GF',
});

const sfPersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: 'cbb8af31-05f0-49d8-8224-1711e0216017',
    type: 'personnelTemplate',
    personnelType: 'sf',
    name: 'Staffelführung',
    image: {
        url: '/assets/sf-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(0, 0, 0, 'and'),
    overrideTreatmentRange: 0,
    treatmentRange: 0,
    abbreviation: 'SF',
});

const fireSinglePersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: '3fc0e389-0f0d-4d83-b8d1-88f59e68bb17',
    type: 'personnelTemplate',
    personnelType: 'fireSingle',
    name: 'Feuerwehrkraft',
    image: {
        url: '/assets/fire-single-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(0, 0, 0, 'and'),
    overrideTreatmentRange: 0,
    treatmentRange: 0,
    abbreviation: 'FSi',
});

const fireSquadPersonnelTemplate: PersonnelTemplate = cloneDeepImmutable({
    id: '4ce35c25-e528-4e36-a002-1eb8b25f64fb',
    type: 'personnelTemplate',
    personnelType: 'fireSquad',
    name: 'Trupp',
    image: {
        url: '/assets/fire-squad-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(0, 0, 0, 'and'),
    overrideTreatmentRange: 0,
    treatmentRange: 0,
    abbreviation: 'FSq',
});

export const defaultPersonnelTemplates = {
    san: sanPersonnelTemplate,
    rettSan: rettSanPersonnelTemplate,
    notSan: notSanPersonnelTemplate,
    notarzt: notarztPersonnelTemplate,
    gf: gfPersonnelTemplate,
    sf: sfPersonnelTemplate,
    fireSingle: fireSinglePersonnelTemplate,
    fireSquad: fireSquadPersonnelTemplate,
} as const;

export const defaultPersonnelTemplatesById = Object.fromEntries(
    Object.values(defaultPersonnelTemplates).map((template) => [
        template.id,
        template,
    ])
);
