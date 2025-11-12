import { VehicleTemplate } from '../../models/index.js';
import type { ImageProperties } from '../../models/utils/index.js';
import { defaultMaterialTemplates } from './material-templates.js';

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

const rtwVehicleTemplate = VehicleTemplate.create(
    'RTW',
    `RTW ???`,
    rtwImage,
    1,
    ['notSan', 'rettSan'],
    [defaultMaterialTemplates.standard.id]
);

const nawVehicleTemplate = VehicleTemplate.create(
    'NAW',
    `NAW ???`,
    nawImage,
    1,
    ['notarzt', 'notSan', 'rettSan'],
    [defaultMaterialTemplates.standard.id]
);

const ktwVehicleTemplate = VehicleTemplate.create(
    'KTW',
    `KTW ???`,
    ktwImage,
    1,
    ['san', 'rettSan'],
    [defaultMaterialTemplates.standard.id]
);

const carryingUnitVehicleTemplate = VehicleTemplate.create(
    'Tragetrupp',
    `Tragetrupp ???`,
    carryingUnitImage,
    1,
    [],
    []
);

const ktwKatSchutzVehicleTemplate = VehicleTemplate.create(
    'KTW (KatSchutz)',
    `KTW (KatSchutz) ???`,
    ktwImage,
    2,
    ['san', 'rettSan'],
    [defaultMaterialTemplates.standard.id]
);

const gwSanVehicleTemplate = VehicleTemplate.create(
    'GW-San',
    `GW-San ???`,
    gwSanImage,
    0,
    ['gf', 'rettSan', 'rettSan', 'san', 'san', 'notarzt'],
    [
        defaultMaterialTemplates.big.id,
        defaultMaterialTemplates.big.id,
        defaultMaterialTemplates.big.id,
        defaultMaterialTemplates.big.id,
    ]
);

const nefVehicleTemplate = VehicleTemplate.create(
    'NEF',
    `NEF ???`,
    nefImage,
    0,
    ['notarzt', 'notSan'],
    [defaultMaterialTemplates.standard.id]
);

const rthVehicleTemplate = VehicleTemplate.create(
    'RTH',
    `RTH ???`,
    rthImage,
    1,
    ['notarzt', 'notSan'],
    [defaultMaterialTemplates.standard.id]
);

export const defaultVehicleTemplates: readonly VehicleTemplate[] = [
    rtwVehicleTemplate,
    ktwVehicleTemplate,
    ktwKatSchutzVehicleTemplate,
    nefVehicleTemplate,
    gwSanVehicleTemplate,
    carryingUnitVehicleTemplate,
    rthVehicleTemplate,
    nawVehicleTemplate,
];
