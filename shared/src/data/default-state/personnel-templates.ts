import { PersonnelTemplate } from '../../models/personnel-template.js';
import { CanCaterFor } from '../../models/utils/cater-for.js';
import {
    defaultOverrideTreatmentRange,
    defaultTreatmentRange,
} from './default-treatment-range.js';

const sanPersonnelTemplate = PersonnelTemplate.create(
    'san',
    'Sanitäter',
    {
        url: '/assets/san-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    CanCaterFor.create(0, 0, 5, 'and'),
    defaultOverrideTreatmentRange,
    defaultTreatmentRange,
    'San'
);

const rettSanPersonnelTemplate = PersonnelTemplate.create(
    'rettSan',
    'Rettungssanitäter',
    {
        url: '/assets/rettSan-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    CanCaterFor.create(1, 2, 0, 'and'),
    defaultOverrideTreatmentRange,
    defaultTreatmentRange,
    'RS'
);

const notSanPersonnelTemplate = PersonnelTemplate.create(
    'notSan',
    'Notfallsanitäter',
    {
        url: '/assets/notSan-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    CanCaterFor.create(2, 1, 0, 'and'),
    defaultOverrideTreatmentRange,
    defaultTreatmentRange,
    'NFS'
);

const notarztPersonnelTemplate = PersonnelTemplate.create(
    'notarzt',
    'Notarzt',
    {
        url: '/assets/notarzt-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    CanCaterFor.create(2, 2, 2, 'and'),
    defaultOverrideTreatmentRange,
    15,
    'NA'
);

const gfPersonnelTemplate = PersonnelTemplate.create(
    'gf',
    'Gruppenführer',
    {
        url: '/assets/gf-personnel.svg',
        height: 80,
        aspectRatio: 1,
    },
    CanCaterFor.create(0, 0, 0, 'and'),
    0,
    0,
    'GF'
);

export const defaultPersonnelTemplates: {
    [key in string]: PersonnelTemplate;
} = {
    san: sanPersonnelTemplate,
    rettSan: rettSanPersonnelTemplate,
    notSan: notSanPersonnelTemplate,
    notarzt: notarztPersonnelTemplate,
    gf: gfPersonnelTemplate,
};
