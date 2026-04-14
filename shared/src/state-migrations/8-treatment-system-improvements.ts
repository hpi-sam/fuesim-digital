import { cloneDeepMutable } from '../utils/clone-deep.js';
import { SpatialTree } from '../models/utils/spatial-tree.js';
import { StrictObject } from '../utils/strict-object.js';
import type { Migration } from './migration-functions.js';

export const treatmentSystemImprovements8: Migration = {
    action: (_intermediaryState, action: any) => {
        switch (action.type) {
            case '[Vehicle] Add vehicle':
                for (const material of action.materials) {
                    migrateMaterial(material);
                }
                for (const personnel of action.personnel) {
                    migratePersonnel(personnel);
                }
                break;
            case '[Patient] Add patient':
                migratePatient(action.patient);
                break;
            case '[Vehicle] Load vehicle':
                if (action.elementToBeLoadedType === 'material') {
                    action.elementToBeLoadedType = 'materials';
                } else if (action.elementToBeLoadedType === 'patient') {
                    action.elementToBeLoadedType = 'patients';
                }
        }
        return true;
    },
    state: (state: any) => {
        // Spatial tree
        state.spatialTrees = cloneDeepMutable({
            materials: SpatialTree.create(),
            patients: SpatialTree.create(),
            personnel: SpatialTree.create(),
        });
        for (const material of StrictObject.values(state.materials)) {
            migrateMaterial(material);
            if (!material.position) {
                continue;
            }
            SpatialTree.addElement(
                state.spatialTrees.materials,
                material.id,
                material.position
            );
        }
        for (const personnel of StrictObject.values(state.personnel)) {
            migratePersonnel(personnel);
            if (!personnel.position) {
                continue;
            }
            SpatialTree.addElement(
                state.spatialTrees.personnel,
                personnel.id,
                personnel.position
            );
        }
        // Migrate patients
        for (const patient of StrictObject.values(state.patients)) {
            migratePatient(patient);
            for (const personnel of StrictObject.values(state.personnel)) {
                if (personnel.assignedPatientIds[patient.id]) {
                    patient.assignedPersonnelIds[personnel.id] = true;
                }
            }
            for (const material of StrictObject.values(state.materials)) {
                if (material.assignedPatientIds[patient.id]) {
                    patient.assignedMaterialIds[material.id] = true;
                }
            }
            if (!patient.position) {
                continue;
            }
            SpatialTree.addElement(
                state.spatialTrees.patients,
                patient.id,
                patient.position
            );
        }
        // VehicleTemplates
        for (const vehicleTemplate of state.vehicleTemplates) {
            vehicleTemplate.materials = vehicleTemplate.materials.map(
                () => 'standard'
            );
        }
        // PatientCategories
        for (const patientCategory of state.patientCategories) {
            migrateImageProperties(patientCategory.image);
        }
    },
};

function migrateMaterial(material: any) {
    material.overrideTreatmentRange = 0.5;
    material.treatmentRange = 5;
}

function migratePersonnel(personnel: any) {
    personnel.overrideTreatmentRange = 0.5;
    personnel.treatmentRange = 5;
}

function migratePatient(patient: any) {
    migrateImageProperties(patient.image);
    patient.assignedPersonnelIds = {};
    patient.assignedMaterialIds = {};
    patient.visibleStatusChanged = false;
}

function migrateImageProperties(image: any) {
    if (image.url === '/assets/male-patient.svg') {
        image.url = '/assets/patient.svg';
    }
}
