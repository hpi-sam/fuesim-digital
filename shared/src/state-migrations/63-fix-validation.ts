import { z } from 'zod';
import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface ImageProperties {
    url: string;
}
interface Vehicle {
    vehicleType: string;
    name: string;
    image: ImageProperties;
}
interface VehicleParameters {
    vehicle: Vehicle;
    personnel: Personnel[];
    material: Material[];
}
interface VehicleTemplate {
    type: 'vehicleTemplate';
    vehicleType: string;
    name: string;
    patientCapacity: number;
    image: ImageProperties;
}

interface Personnel {
    vehicleName: string;
    personnelType: string;
    typeName: string;
    typeAbbreviation: string;
    image: ImageProperties;
}
interface PersonnelTemplate {
    type: 'personnelTemplate';
    personnelType: string;
    name: string;
    abbreviation: string;
    image: ImageProperties;
}

interface Material {
    vehicleName: string;
    typeName: string;
    image: ImageProperties;
}
interface MaterialTemplate {
    type: 'materialTemplate';
    name: string;
    image: ImageProperties;
}

interface MapImage {
    image: ImageProperties;
}
interface MapImageTemplate {
    type: 'mapImageTemplate';
    name: string;
    image: ImageProperties;
}

interface AlarmGroup {
    type: 'alarmGroup';
    name: string;
    triggerCount: number;
    triggerLimit: number;
}

function isValidUrl(val: string) {
    return z.url().safeParse(val).success;
}

function migrateVehicle(vehicle: Vehicle) {
    if (vehicle.vehicleType.trim() === '') {
        vehicle.vehicleType = '-';
    }
    if (vehicle.name.trim() === '') {
        vehicle.name = '-';
    }
    if (!isValidUrl(vehicle.image.url)) {
        vehicle.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
}

function migrateVehicleTemplate(vehicleTemplate: VehicleTemplate) {
    if (vehicleTemplate.vehicleType.trim() === '') {
        vehicleTemplate.vehicleType = '-';
    }
    if (vehicleTemplate.name.trim() === '') {
        vehicleTemplate.name = '-';
    }
    if (!isValidUrl(vehicleTemplate.image.url)) {
        vehicleTemplate.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
    if (!z.int().safeParse(vehicleTemplate.patientCapacity).success) {
        vehicleTemplate.patientCapacity = Math.floor(
            vehicleTemplate.patientCapacity
        );
    }
}

function migratePersonnel(personnel: Personnel) {
    if (personnel.personnelType.trim() === '') {
        personnel.personnelType = '-';
    }
    if (personnel.vehicleName.trim() === '') {
        personnel.vehicleName = '-';
    }
    if (personnel.typeName.trim() === '') {
        personnel.typeName = '-';
    }
    if (personnel.typeAbbreviation.trim() === '') {
        personnel.typeAbbreviation = '-';
    }
    if (!isValidUrl(personnel.image.url)) {
        personnel.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
}

function migratePersonnelTemplate(personnelTemplate: PersonnelTemplate) {
    if (personnelTemplate.personnelType.trim() === '') {
        personnelTemplate.personnelType = '-';
    }
    if (personnelTemplate.name.trim() === '') {
        personnelTemplate.name = '-';
    }
    if (personnelTemplate.abbreviation.trim() === '') {
        personnelTemplate.abbreviation = '-';
    }
    if (!isValidUrl(personnelTemplate.image.url)) {
        personnelTemplate.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
}

function migrateMaterial(material: Material) {
    if (material.vehicleName.trim() === '') {
        material.vehicleName = '-';
    }
    if (material.typeName.trim() === '') {
        material.typeName = '-';
    }
    if (!isValidUrl(material.image.url)) {
        material.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
}

function migrateMaterialTemplate(materialTemplate: MaterialTemplate) {
    if (materialTemplate.name.trim() === '') {
        materialTemplate.name = '-';
    }
    if (!isValidUrl(materialTemplate.image.url)) {
        materialTemplate.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
}

function migrateMapImage(mapImage: MapImage) {
    if (!isValidUrl(mapImage.image.url)) {
        mapImage.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
}

function migrateMapImageTemplate(mapImageTemplate: MapImageTemplate) {
    if (mapImageTemplate.name.trim() === '') {
        mapImageTemplate.name = '-';
    }
    if (!isValidUrl(mapImageTemplate.image.url)) {
        mapImageTemplate.image.url =
            'https://fuesim.digital/assets/default-placeholder.svg';
    }
}

function migrateAlarmGroup(alarmGroup: AlarmGroup) {
    if (alarmGroup.name.trim() === '') {
        alarmGroup.name = '-';
    }
    if (!z.int().safeParse(alarmGroup.triggerCount).success) {
        alarmGroup.triggerCount = Math.floor(alarmGroup.triggerCount);
    }
    if (!z.int().safeParse(alarmGroup.triggerLimit).success) {
        alarmGroup.triggerLimit = Math.floor(alarmGroup.triggerLimit);
    }
}
type Template =
    | AlarmGroup
    | MapImageTemplate
    | MaterialTemplate
    | PersonnelTemplate
    | VehicleTemplate
    | { type: 'dummyTemplate' };

type Action =
    | {
          type: '[AlarmGroup] Add AlarmGroup';
          alarmGroup: AlarmGroup;
      }
    | {
          type: '[AlarmGroup] Limit AlarmGroup';
          triggerLimit: number;
      }
    | {
          type: '[AlarmGroup] Rename AlarmGroup';
          name: string;
      }
    | {
          type: '[Collection] Add Collection';
          overwriteTemplates: Template[];
      }
    | {
          type: '[Collection] Upgrade Collection';
          overwriteTemplates: Template[];
      }
    | {
          type: '[DUMMY]';
      }
    | {
          type: '[Emergency Operation Center] Send Alarm Group';
          sortedVehicleParameters: VehicleParameters[];
      }
    | {
          type: '[MapImage] Add MapImage';
          mapImage: MapImage;
      }
    | {
          type: '[Vehicle] Add vehicle';
          vehicleParameters: VehicleParameters;
      }
    | {
          type: '[Vehicle] Rename vehicle';
          name: string;
      }
    | {
          type: '[Collection] Remove Collection';
          overwriteTemplates: Template[];
      };

function migrateTemplates(templates: Template[]) {
    for (const template of templates) {
        switch (template.type) {
            case 'vehicleTemplate':
                migrateVehicleTemplate(template);
                break;
            case 'personnelTemplate':
                migratePersonnelTemplate(template);
                break;
            case 'materialTemplate':
                migrateMaterialTemplate(template);
                break;
            case 'mapImageTemplate':
                migrateMapImageTemplate(template);
                break;
            case 'alarmGroup':
                migrateAlarmGroup(template);
                break;
            default:
                break;
        }
    }
}

export const fixValidation63: Migration = {
    state: (state: any) => {
        const typedState = state as {
            vehicles: {
                [key: UUID]: Vehicle;
            };
            personnel: {
                [key: UUID]: Personnel;
            };
            materials: {
                [key: UUID]: Material;
            };
            mapImages: {
                [key: UUID]: MapImage;
            };
            alarmGroups: {
                [key: UUID]: AlarmGroup;
            };
            templates: {
                [key: UUID]: Template;
            };
        };

        for (const vehicle of Object.values(typedState.vehicles)) {
            migrateVehicle(vehicle);
        }
        for (const personnel of Object.values(typedState.personnel)) {
            migratePersonnel(personnel);
        }
        for (const material of Object.values(typedState.materials)) {
            migrateMaterial(material);
        }
        for (const mapImage of Object.values(typedState.mapImages)) {
            migrateMapImage(mapImage);
        }
        for (const alarmGroup of Object.values(typedState.alarmGroups)) {
            migrateAlarmGroup(alarmGroup);
        }

        migrateTemplates(Object.values(typedState.templates));
    },
    action: (_, action: any) => {
        const typedAction = action as Action;
        switch (typedAction.type) {
            case '[Vehicle] Add vehicle':
                migrateVehicle(typedAction.vehicleParameters.vehicle);
                typedAction.vehicleParameters.personnel.forEach(
                    migratePersonnel
                );
                typedAction.vehicleParameters.material.forEach(migrateMaterial);
                break;
            case '[Emergency Operation Center] Send Alarm Group':
                for (const vehicleParameters of typedAction.sortedVehicleParameters) {
                    migrateVehicle(vehicleParameters.vehicle);
                    vehicleParameters.personnel.forEach(migratePersonnel);
                    vehicleParameters.material.forEach(migrateMaterial);
                }
                break;
            case '[MapImage] Add MapImage':
                migrateMapImage(typedAction.mapImage);
                break;
            case '[AlarmGroup] Add AlarmGroup':
                migrateAlarmGroup(typedAction.alarmGroup);
                break;
            case '[AlarmGroup] Limit AlarmGroup':
                if (!z.int().safeParse(typedAction.triggerLimit).success) {
                    typedAction.triggerLimit = Math.floor(
                        typedAction.triggerLimit
                    );
                }
                break;
            case '[AlarmGroup] Rename AlarmGroup':
                if (typedAction.name.trim() === '') {
                    typedAction.name = '-';
                }
                break;
            case '[Collection] Add Collection':
            case '[Collection] Upgrade Collection':
            case '[Collection] Remove Collection':
                migrateTemplates(typedAction.overwriteTemplates);
                break;
            default:
                break;
        }
        return true;
    },
};
