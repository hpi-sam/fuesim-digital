import type { VehicleTemplate } from '../../models/vehicle-template.js';
import type { ImageProperties } from '../../models/utils/image-properties.js';
import type { AlarmGroup } from '../../models/alarm-group.js';
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

// ==================================================

const rtwAlarmGroup: AlarmGroup = {
    id: 'd3e7fff2-dd7c-40a5-803f-214469a1d752',
    type: 'alarmGroup',
    name: 'RTW ???',
    alarmGroupVehicles: {
        '07515357-3bf1-4b63-a46b-299c97dadf20': {
            id: '07515357-3bf1-4b63-a46b-299c97dadf20',
            name: 'RTW ???',
            vehicleTemplateId: rtwVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

const nawAlarmGroup: AlarmGroup = {
    id: 'a313ebfd-f28b-4185-831a-59ebb924c43d',
    type: 'alarmGroup',
    name: 'NAW ???',
    alarmGroupVehicles: {
        'b253221c-a3ed-4770-8653-d96c84662132': {
            id: 'b253221c-a3ed-4770-8653-d96c84662132',
            name: 'NAW ???',
            vehicleTemplateId: nawVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

const ktwAlarmGroup: AlarmGroup = {
    id: '6ddbb14e-c135-4204-9223-224e6bc3bb0c',
    type: 'alarmGroup',
    name: 'KTW ???',
    alarmGroupVehicles: {
        'd957a886-403c-4036-9867-439ea2424646': {
            id: 'd957a886-403c-4036-9867-439ea2424646',
            name: 'KTW ???',
            vehicleTemplateId: ktwVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

const carryingUnitAlarmGroup: AlarmGroup = {
    id: '785c0104-c35e-4f77-a86e-acba2f6f973d',
    type: 'alarmGroup',
    name: 'Tragetrupp ???',
    alarmGroupVehicles: {
        '189101a0-017a-465e-8038-20883ed09a4c': {
            id: '189101a0-017a-465e-8038-20883ed09a4c',
            name: 'Tragetrupp ???',
            vehicleTemplateId: carryingUnitVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

const ktwKatSchutzAlarmGroup: AlarmGroup = {
    id: '5e4e1cb9-b101-488e-8bd6-88d82127beda',
    type: 'alarmGroup',
    name: 'KTW (KatSchutz) ???',
    alarmGroupVehicles: {
        '096fc948-f629-4f27-828d-62f6f06f184f': {
            id: '096fc948-f629-4f27-828d-62f6f06f184f',
            name: 'KTW (KatSchutz) ???',
            vehicleTemplateId: ktwKatSchutzVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

const gwSanAlarmGroup: AlarmGroup = {
    id: '91c1180e-3060-4793-adb2-d200d1c1f879',
    type: 'alarmGroup',
    name: 'GW-San ???',
    alarmGroupVehicles: {
        'ebb43402-85e5-42b9-ba1f-e331fca7ab58': {
            id: 'ebb43402-85e5-42b9-ba1f-e331fca7ab58',
            name: 'GW-San ???',
            vehicleTemplateId: gwSanVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

const nefAlarmGroup: AlarmGroup = {
    id: 'c44dbf7b-6d61-4ab6-9b9a-704a9265544a',
    type: 'alarmGroup',
    name: 'NEF ???',
    alarmGroupVehicles: {
        'c64b89f5-ea24-4b98-9033-db259b8590d4': {
            id: 'c64b89f5-ea24-4b98-9033-db259b8590d4',
            name: 'NEF ???',
            vehicleTemplateId: nefVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

const rthAlarmGroup: AlarmGroup = {
    id: 'd7342c44-7c5e-4dcd-909c-75afff9dd557',
    type: 'alarmGroup',
    name: 'RTH ???',
    alarmGroupVehicles: {
        '4b2330f8-51e1-4d13-9325-60ac746facab': {
            id: '4b2330f8-51e1-4d13-9325-60ac746facab',
            name: 'RTH ???',
            vehicleTemplateId: rthVehicleTemplate.id,
            time: 300000,
        },
    },
    triggerCount: 0,
    triggerLimit: null,
};

export const defaultAlarmGroups = {
    rtw: rtwAlarmGroup,
    naw: nawAlarmGroup,
    ktw: ktwAlarmGroup,
    carryingUnit: carryingUnitAlarmGroup,
    ktwKatSchutz: ktwKatSchutzAlarmGroup,
    gwSan: gwSanAlarmGroup,
    nef: nefAlarmGroup,
    rth: rthAlarmGroup,
};

export const defaultAlarmGroupsById = Object.fromEntries(
    Object.values(defaultAlarmGroups).map((group) => [group.id, group])
);
