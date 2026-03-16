import type { VehicleTemplate, ImageProperties } from '../../models/index.js';
import { defaultMaterialTemplates } from './material-templates.js';
import { defaultPersonnelTemplates } from './personnel-templates.js';

const rtwImage: ImageProperties = {
    url: '/assets/rtw-vehicle.png',
    height: 100,
    aspectRatio: 3693 / 1670,
};

const nawImage: ImageProperties = {
    url: '/assets/naw-vehicle.png',
    height: 100,
    aspectRatio: 3693 / 1670,
};

const ktwImage: ImageProperties = {
    url: '/assets/ktw-vehicle.png',
    height: 100,
    aspectRatio: 5046 / 2465,
};

const gwSanImage: ImageProperties = {
    url: '/assets/gwSan-vehicle.png',
    height: 120,
    aspectRatio: 5000 / 2474,
};

const nefImage: ImageProperties = {
    url: '/assets/nef-vehicle.png',
    height: 70,
    aspectRatio: 4455 / 1847,
};

const rthImage: ImageProperties = {
    url: '/assets/rth-vehicle.svg',
    height: 300,
    aspectRatio: 310 / 130,
};

const carryingUnitImage: ImageProperties = {
    url: '/assets/carrying-unit.svg',
    height: 210,
    aspectRatio: 1,
};

const rtwVehicleTemplate: VehicleTemplate = {
    id: 'f7d8fe70-128d-4cc0-97bd-15e2ccd5d4b9',
    type: 'vehicleTemplate',
    vehicleType: 'RTW',
    name: 'RTW ???',
    image: rtwImage,
    patientCapacity: 1,
    personnelTemplateIds: [
        defaultPersonnelTemplates.notSan.id,
        defaultPersonnelTemplates.rettSan.id,
    ],
    materialTemplateIds: [defaultMaterialTemplates.standard.id],
};

const nawVehicleTemplate: VehicleTemplate = {
    id: '8e9f22dc-d9f8-4fd1-a865-c285ce91dde3',
    type: 'vehicleTemplate',
    vehicleType: 'NAW',
    name: `NAW ???`,
    image: nawImage,
    patientCapacity: 1,
    personnelTemplateIds: [
        defaultPersonnelTemplates.notarzt.id,
        defaultPersonnelTemplates.notSan.id,
        defaultPersonnelTemplates.rettSan.id,
    ],
    materialTemplateIds: [defaultMaterialTemplates.standard.id],
};

const ktwVehicleTemplate: VehicleTemplate = {
    id: 'b5b241d1-e002-454d-8090-175cb88cdb6e',
    type: 'vehicleTemplate',
    vehicleType: 'KTW',
    name: `KTW ???`,
    image: ktwImage,
    patientCapacity: 1,
    personnelTemplateIds: [
        defaultPersonnelTemplates.san.id,
        defaultPersonnelTemplates.rettSan.id,
    ],
    materialTemplateIds: [defaultMaterialTemplates.standard.id],
};

const carryingUnitVehicleTemplate: VehicleTemplate = {
    id: '0dd54aae-79fc-4870-9393-f619571c8ca7',
    type: 'vehicleTemplate',
    vehicleType: 'Tragetrupp',
    name: `Tragetrupp ???`,
    image: carryingUnitImage,
    patientCapacity: 1,
    personnelTemplateIds: [],
    materialTemplateIds: [],
};

const ktwKatSchutzVehicleTemplate: VehicleTemplate = {
    id: '3bb9412a-1412-46b1-9c92-54939156b669',
    type: 'vehicleTemplate',
    vehicleType: 'KTW (KatSchutz)',
    name: `KTW (KatSchutz) ???`,
    image: ktwImage,
    patientCapacity: 2,
    personnelTemplateIds: [
        defaultPersonnelTemplates.san.id,
        defaultPersonnelTemplates.rettSan.id,
    ],
    materialTemplateIds: [defaultMaterialTemplates.standard.id],
};

const gwSanVehicleTemplate: VehicleTemplate = {
    id: '51018aa6-c38b-4c1a-9bcf-99dd8ebe7e5b',
    type: 'vehicleTemplate',
    vehicleType: 'GW-San',
    name: `GW-San ???`,
    image: gwSanImage,
    patientCapacity: 0,
    personnelTemplateIds: [
        defaultPersonnelTemplates.gf.id,
        defaultPersonnelTemplates.rettSan.id,
        defaultPersonnelTemplates.rettSan.id,
        defaultPersonnelTemplates.san.id,
        defaultPersonnelTemplates.san.id,
        defaultPersonnelTemplates.notarzt.id,
    ],
    materialTemplateIds: [
        defaultMaterialTemplates.big.id,
        defaultMaterialTemplates.big.id,
        defaultMaterialTemplates.big.id,
        defaultMaterialTemplates.big.id,
    ],
};

const nefVehicleTemplate: VehicleTemplate = {
    id: 'dcdb5d3e-4654-420d-9847-22bdd97e686c',
    type: 'vehicleTemplate',
    vehicleType: 'NEF',
    name: `NEF ???`,
    image: nefImage,
    patientCapacity: 0,
    personnelTemplateIds: [
        defaultPersonnelTemplates.notarzt.id,
        defaultPersonnelTemplates.notSan.id,
    ],
    materialTemplateIds: [defaultMaterialTemplates.standard.id],
};

const rthVehicleTemplate: VehicleTemplate = {
    id: '01da16b9-ae27-458f-9f6b-cb8cfed63d83',
    type: 'vehicleTemplate',
    vehicleType: 'RTH',
    name: `RTH ???`,
    image: rthImage,
    patientCapacity: 1,
    personnelTemplateIds: [
        defaultPersonnelTemplates.notarzt.id,
        defaultPersonnelTemplates.notSan.id,
    ],
    materialTemplateIds: [defaultMaterialTemplates.standard.id],
};

export const defaultVehicleTemplates = {
    rtw: rtwVehicleTemplate,
    ktw: ktwVehicleTemplate,
    ktwKatSchutz: ktwKatSchutzVehicleTemplate,
    nef: nefVehicleTemplate,
    gwSan: gwSanVehicleTemplate,
    carryingUnit: carryingUnitVehicleTemplate,
    rth: rthVehicleTemplate,
    naw: nawVehicleTemplate,
} as const;

export const defaultVehicleTemplatesById = Object.fromEntries(
    Object.values(defaultVehicleTemplates).map((template) => [
        template.id,
        template,
    ])
);
