import type { PersonnelTemplate } from '../../models/personnel-template.js';
import type { MaterialTemplate } from '../../models/material-template.js';
import type { VehicleTemplate } from '../../models/vehicle-template.js';
import { newCanCaterFor } from '../../models/utils/cater-for.js';
import { cloneDeepImmutable } from '../../utils/clone-deep.js';
import {
    defaultOverrideTreatmentRange,
    defaultTreatmentRange,
} from './default-treatment-range.js';

const firefightingSinglePersonnelTemplate: PersonnelTemplate =
    cloneDeepImmutable({
        id: '65e4d0d5-8bfd-46cd-9fd8-f81773dcd4b9',
        type: 'personnelTemplate',
        personnelType: 'feuerwehrMA',
        name: 'Maschinist',
        image: {
            url: '/assets/fire-single-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
        canCaterFor: newCanCaterFor(1, 1, 1, 'or'),
        overrideTreatmentRange: defaultOverrideTreatmentRange,
        treatmentRange: defaultTreatmentRange,
        abbreviation: 'MA',
    });

const firefightingSquadPersonnelTemplate: PersonnelTemplate =
    cloneDeepImmutable({
        id: '68c6e81d-6dab-459e-843b-d2dbed5498a5',
        type: 'personnelTemplate',
        personnelType: 'feuerwehrTrupp',
        name: 'Trupp',
        image: {
            url: '/assets/fire-squad-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
        canCaterFor: newCanCaterFor(1, 2, 2, 'and'),
        overrideTreatmentRange: 0,
        treatmentRange: 0,
        abbreviation: 'Tr',
    });

const firefightingLeaderBluePersonnelTemplate: PersonnelTemplate =
    cloneDeepImmutable({
        id: 'bb08d420-a292-451e-bafe-66edd412fc97',
        type: 'personnelTemplate',
        personnelType: 'feuerwehrGF',
        name: 'Grppenführer',
        image: {
            url: '/assets/fire-leader-blue-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
        canCaterFor: newCanCaterFor(0, 0, 0, 'or'),
        overrideTreatmentRange: defaultOverrideTreatmentRange,
        treatmentRange: defaultTreatmentRange,
        abbreviation: 'GF',
    });

const firefightingLeaderRedPersonnelTemplate: PersonnelTemplate =
    cloneDeepImmutable({
        id: 'd386c725-d9e6-4fef-a762-869ecf7b1bd4',
        type: 'personnelTemplate',
        personnelType: 'feuerwehrZF',
        name: 'Zugführer',
        image: {
            url: '/assets/fire-leader-red-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
        canCaterFor: newCanCaterFor(0, 0, 0, 'or'),
        overrideTreatmentRange: defaultOverrideTreatmentRange,
        treatmentRange: defaultTreatmentRange,
        abbreviation: 'ZF',
    });

const firefightingLeaderWhitePersonnelTemplate: PersonnelTemplate =
    cloneDeepImmutable({
        id: '5febeb7f-09a1-46ee-bad0-db6ef066d9a8',
        type: 'personnelTemplate',
        personnelType: 'feuerwehrEAL',
        name: 'Einsatzabschnittsleiter',
        image: {
            url: '/assets/fire-leader-white-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
        canCaterFor: newCanCaterFor(0, 0, 0, 'or'),
        overrideTreatmentRange: defaultOverrideTreatmentRange,
        treatmentRange: defaultTreatmentRange,
        abbreviation: 'EAL',
    });

const firefightingLeaderYellowPersonnelTemplate: PersonnelTemplate =
    cloneDeepImmutable({
        id: '61270b3a-a626-4ce2-b5ca-6431d921b861',
        type: 'personnelTemplate',
        personnelType: 'feuerwehrEL',
        name: 'Einsatzleiter',
        image: {
            url: '/assets/fire-leader-yellow-personnel.svg',
            height: 80,
            aspectRatio: 1,
        },
        canCaterFor: newCanCaterFor(0, 0, 0, 'or'),
        overrideTreatmentRange: defaultOverrideTreatmentRange,
        treatmentRange: defaultTreatmentRange,
        abbreviation: 'EL',
    });

export const firefightingDefaultPersonnelTemplates = {
    ma: firefightingSinglePersonnelTemplate,
    tr: firefightingSquadPersonnelTemplate,
    gf: firefightingLeaderBluePersonnelTemplate,
    zf: firefightingLeaderRedPersonnelTemplate,
    eal: firefightingLeaderWhitePersonnelTemplate,
    el: firefightingLeaderYellowPersonnelTemplate,
} as const;

export const firefightingDefaultPersonnelTemplatesById = Object.fromEntries(
    Object.values(firefightingDefaultPersonnelTemplates).map((template) => [
        template.id,
        template,
    ])
);

const firefightingStandardMaterialTemplate: MaterialTemplate = {
    id: '7613fdec-bb8c-44ef-bff1-255270dd0070',
    type: 'materialTemplate',
    name: 'Einsatzmaterial',
    image: {
        url: '/assets/big-material.svg',
        height: 35,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(0, 0, 0, 'and'),
    overrideTreatmentRange: 0,
    treatmentRange: 0,
};

const firefightingMedicalMaterialTemplate: MaterialTemplate = {
    id: '53e3df96-89a5-4e4d-8227-bc45a0689813',
    type: 'materialTemplate',
    name: 'Notfallrucksack',
    image: {
        url: '/assets/material.svg',
        height: 35,
        aspectRatio: 1,
    },
    canCaterFor: newCanCaterFor(1, 2, 0, 'and'),
    overrideTreatmentRange: defaultOverrideTreatmentRange,
    treatmentRange: defaultTreatmentRange,
};

export const firefightingDefaultMaterialTemplates = {
    standard: firefightingStandardMaterialTemplate,
    medical: firefightingMedicalMaterialTemplate,
} as const;

export const firefightingDefaultMaterialTemplatesById = Object.fromEntries(
    Object.values(firefightingDefaultMaterialTemplates).map((template) => [
        template.id,
        template,
    ])
);

const hlfVehicleTemplate: VehicleTemplate = {
    id: '213fb6dc-4746-413f-8bac-3383a2b771a4',
    type: 'vehicleTemplate',
    vehicleType: 'HLF',
    name: `HLF #`,
    image: {
        url: '/assets/hlf-vehicle.png',
        height: 120,
        aspectRatio: 4533 / 1735,
    },
    patientCapacity: 0,
    patientLoadMinutes: 0,
    personnelTemplateIds: [
        firefightingLeaderBluePersonnelTemplate.id,
        firefightingSquadPersonnelTemplate.id,
        firefightingSquadPersonnelTemplate.id,
        firefightingSinglePersonnelTemplate.id,
    ],
    materialTemplateIds: [
        firefightingStandardMaterialTemplate.id,
        firefightingStandardMaterialTemplate.id,
        firefightingStandardMaterialTemplate.id,
        firefightingMedicalMaterialTemplate.id,
    ],
};

export const firefightingDefaultVehicleTemplates = {
    hlf: hlfVehicleTemplate,
} as const;

export const firefightingDefaultVehicleTemplatesById = Object.fromEntries(
    Object.values(firefightingDefaultVehicleTemplates).map((template) => [
        template.id,
        template,
    ])
);
