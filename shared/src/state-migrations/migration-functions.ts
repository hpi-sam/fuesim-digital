import type { ExerciseState } from '../state.js';
import { renameDeleteTransferAction10 } from './10-rename-delete-transfer-action.js';
import { addMapImageIsLocked11 } from './11-add-map-image-is-locked.js';
import { renameIncorrectPatientImages12 } from './12-rename-incorrect-patient-images.js';
import { addMapImageZIndex13 } from './13-add-map-image-zindex.js';
import { addPersonnelAndMaterialToState14 } from './14-add-personnel-and-material-templates-to-state.js';
import { addSimulatedRegions15 } from './15-add-simulated-regions.js';
import { addMetaPosition16 } from './16-add-meta-position.js';
import { addTypeProperty17 } from './17-add-type-property.js';
import { replacePositionWithMetaPosition18 } from './18-replace-position-with-meta-position.js';
import { renameStartPointTypes19 } from './19-rename-start-point-types.js';
import { addSimulationProperties20 } from './20-add-simulation-properties.js';
import { fixTypoInRenameSimulatedRegion21 } from './21-fix-typo-in-rename-simulated-region.js';
import { removeIllegalVehicleMovementActions22 } from './22-remove-illegal-vehicle-movement-actions.js';
import { addTransferPointToSimulatedRegion23 } from './23-add-transfer-point-to-simulated-region.js';
import { addRadiograms24 } from './24-add-radiograms.js';
import { addPatientStatusTags25 } from './25-add-patient-status-tags.js';
import { addSimulatedRegionBorderColor26 } from './26-add-border-color-to-simulated-region.js';
import { addOccupationToVehicles27 } from './27-add-occupation-to-vehicles.js';
import { activitiesToUnloadVehiclesBehavior28 } from './28-add-activities-to-unload-vehicles-behavior.js';
import { removeTransferVehiclesActivityAndChangeAnswerRequestBehavior29 } from './29-remove-transfer-vehicles-activity-and-change-answer-request-behavior.js';
import { updateEocLog3 } from './3-update-eoc-log.js';
import { reportTreatmentStatusChanges30 } from './30-report-treatment-status-changes.js';
import { improveLoadVehicleActivity31 } from './31-improve-load-vehicle-activity.js';
import { removeIdFromEvents32 } from './32-remove-id-from-events.js';
import { reportTransferCategoryCompleted33 } from './33-report-transfer-category-completed.js';
import { addCatchAllHospital34 } from './34-add-catch-all-hospital.js';
import { addTransferInitiatingRegionToRequestEvents35 } from './35-add-transfer-initiating-region-to-request-events.js';
import { addAlarmGroupIdToAlarmGroupStartPoint36 } from './36-add-alarm-group-id-to-alarm-group-start-point.js';
import { addPatientIdentifiers37 } from './37-add-patient-identifiers.js';
import { deterministicAlarmGroups38 } from './38-deterministic-alarm-groups.js';
import { addCustomPatientQRCode39 } from './39-add-custom-patient-qr-code.js';
import { adaptInterfaceSignallerUI40 } from './40-adapt-interface-signaller-ui.js';
import { removeSetParticipantIdAction4 } from './4-remove-set-participant-id-action.js';
import { removeStatistics5 } from './5-remove-statistics.js';
import { removeStateHistory6 } from './6-remove-state-history.js';
import { addPatientRemarks7 } from './7-add-patient-remarks.js';
import { treatmentSystemImprovements8 } from './8-treatment-system-improvements.js';
import { removeIsBeingTreated9 } from './9-remove-is-being-treated.js';
import { impossibleMigration } from './impossible-migration.js';
import { addPatientTransportPriority41 } from './41-add-patient-transport-prio.js';
import { replaceClientRoles42 } from './42-replace-clientroles.js';
import { addEmergencyOperationsCenterViewport43 } from './43-add-eoc-viewport.js';
import { generalizeMaterialsPersonnel44 } from './44-generalize-materials-personnel.js';
import { addRestrictedZones45 } from './45-add-restricted-zones.js';
import { limitedAlarmgroups46 } from './46-limited-alarm-groups.js';
import { participantIdToKey47 } from './47-participant-id-to-key.js';
import { addAutojoinViewport48 } from './48-autojoin-viewport.js';
import { addOperationsTabletView49 } from './49-add-operations-tablet-view.js';
import { addScoutables50 } from './50-add-scoutables.js';
import { addTechnicalChallenges51 } from './51-add-technical-challenges.js';
import { addMeasures52 } from './52-add-measures.js';

/**
 * Migrate a single action
 * @param intermediaryState - The migrated exercise state just before the action is applied
 * @param action - The action to migrate in place
 * @returns true if the migration was successful or false to indicate that the action should be deleted
 * @throws a {@link RestoreError} when a migration is not possible.
 */
type MigrateActionFunction = (
    intermediaryState: ExerciseState,
    action: object
) => boolean;

/**
 * Such a function gets the not yet migrated state and is expected to mutate it to a migrated version.
 * It may throw a {@link RestoreError} when a migration is not possible.
 */
type MigrateStateFunction = (state: object) => void;

export interface Migration {
    action: MigrateActionFunction | null;
    state: MigrateStateFunction | null;
}

export const migrations: {
    [TargetStateVersion: number]: Migration;
} = {
    2: impossibleMigration,
    3: updateEocLog3,
    4: removeSetParticipantIdAction4,
    5: removeStatistics5,
    6: removeStateHistory6,
    7: addPatientRemarks7,
    8: treatmentSystemImprovements8,
    9: removeIsBeingTreated9,
    10: renameDeleteTransferAction10,
    11: addMapImageIsLocked11,
    12: renameIncorrectPatientImages12,
    13: addMapImageZIndex13,
    14: addPersonnelAndMaterialToState14,
    15: addSimulatedRegions15,
    16: addMetaPosition16,
    17: addTypeProperty17,
    18: replacePositionWithMetaPosition18,
    19: renameStartPointTypes19,
    20: addSimulationProperties20,
    21: fixTypoInRenameSimulatedRegion21,
    22: removeIllegalVehicleMovementActions22,
    23: addTransferPointToSimulatedRegion23,
    24: addRadiograms24,
    25: addPatientStatusTags25,
    26: addSimulatedRegionBorderColor26,
    27: addOccupationToVehicles27,
    28: activitiesToUnloadVehiclesBehavior28,
    29: removeTransferVehiclesActivityAndChangeAnswerRequestBehavior29,
    30: reportTreatmentStatusChanges30,
    31: improveLoadVehicleActivity31,
    32: removeIdFromEvents32,
    33: reportTransferCategoryCompleted33,
    34: addCatchAllHospital34,
    35: addTransferInitiatingRegionToRequestEvents35,
    36: addAlarmGroupIdToAlarmGroupStartPoint36,
    37: addPatientIdentifiers37,
    38: deterministicAlarmGroups38,
    39: addCustomPatientQRCode39,
    40: adaptInterfaceSignallerUI40,
    41: addPatientTransportPriority41,
    42: replaceClientRoles42,
    43: addEmergencyOperationsCenterViewport43,
    44: generalizeMaterialsPersonnel44,
    45: addRestrictedZones45,
    46: limitedAlarmgroups46,
    47: participantIdToKey47,
    48: addAutojoinViewport48,
    49: addOperationsTabletView49,
    50: addScoutables50,
    51: addTechnicalChallenges51,
    52: addMeasures52,
};
