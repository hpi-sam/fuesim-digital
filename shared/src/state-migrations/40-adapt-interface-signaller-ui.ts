import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface ExerciseState {
    alarmGroups: { [key: UUID]: AlarmGroup };
    eocLog: EocLogEntry[];
    radiograms: { [key: UUID]: ExerciseRadiogram };
    simulatedRegions: { [key: UUID]: SimulatedRegion };
}

interface AlarmGroup {
    name: string;
    sent: boolean;
}

interface EocLogEntry {
    message: string;
}

interface SimulatedRegion {
    activities: {
        [stateId: UUID]: ExerciseSimulationActivityState;
    };
    inEvents: ExerciseSimulationEvent[];
}

type ExerciseSimulationActivityState =
    | DelayEventActivityState
    | GenerateReportActivityState
    | GenericActivityState
    | PublishRadiogramActivityState
    | RecurringEventActivityState
    | SendRemoteEventActivityState;

interface DelayEventActivityState {
    type: 'delayEventActivity';
    event: ExerciseSimulationEvent;
}

interface GenerateReportActivityState {
    type: 'generateReportActivity';
    collectEvent: ExerciseSimulationEvent;
    radiogram: ExerciseRadiogram;
}

interface PublishRadiogramActivityState {
    type: 'publishRadiogramActivity';
    radiogram: ExerciseRadiogram;
}

interface RecurringEventActivityState {
    type: 'recurringEventActivity';
    event: ExerciseSimulationEvent;
}

interface SendRemoteEventActivityState {
    type: 'sendRemoteEventActivity';
    event: ExerciseSimulationEvent;
}

interface GenericActivityState {
    type: "This kind of activity state does not actually exist. It's a catch-all for the migration";
    key: string | null;
}

type ExerciseSimulationEvent = GenericEvent | StartCollectingInformationEvent;

interface StartCollectingInformationEvent {
    type: 'startCollectingInformationEvent';
    interfaceSignallerKey: string | null;
}

interface GenericEvent {
    type: "This kind of event does not actually exist. It's a catch-all for the migration";
}

type ExerciseRadiogram = GenericRadiogram | ResourceRequestRadiogram;

interface GenericRadiogram {
    type: "This kind of radiogram does not actually exist. It's a catch-all for the migration";
    informationRequestKey: string | null;
}

interface ResourceRequestRadiogram {
    type: 'resourceRequestRadiogram';

    key?: string | null;
    informationRequestKey: string | null;
    resourceRequestKey: string;

    requiredResource: VehicleResource;
    alreadyPromisedResource: null;
    canBeGranted: boolean;
}

interface VehicleResource {
    type: 'vehicleResource';
    vehicleCounts: { [key in string]: number };
}

/**
 * This migration performs several changes as part of the addition of the interface signaller modal, namely:
 *
 * - Rename `key` to `resourceRequestKey` on `ResourceRequestRadiogram`
 * - Add `informationRequestKey` property (with value `null`) to all radiograms
 * - Add `interfaceSignallerKey` (with value `null`) to `StartCollectingInformationEvent` and `CreateReportAction`
 * - Several additional properties on `ResourceRequestRadiogram` (`requiredResource`, `alreadyPromisedResource`, `canBeGranted`)
 * - Rename `reportTreatmentProgressChanges` to `reportChanges` on `UpdateReportTreatmentStatusChangesAction`
 * - Add `sent` property to `AlarmGroup`
 */
export const adaptInterfaceSignallerUI40: Migration = {
    action: (_intermediaryState, action) => {
        switch ((action as { type: string }).type) {
            // Add `sent`-property to `AlarmGroup`
            case '[AlarmGroup] Add AlarmGroup': {
                const typedAction = action as { alarmGroup: AlarmGroup };
                typedAction.alarmGroup.sent = false;
                break;
            }

            // Rename `reportTreatmentProgressChanges` to `reportChanges` on `UpdateReportTreatmentStatusChangesAction`
            case '[ReportBehavior] Update report treatment status changes': {
                const typedAction = action as {
                    reportTreatmentProgressChanges?: boolean;
                    reportChanges?: boolean;
                };
                typedAction.reportChanges =
                    typedAction.reportTreatmentProgressChanges;
                delete typedAction.reportTreatmentProgressChanges;
                break;
            }

            // Add `interfaceSignallerKey` to `CreateReportAction`
            case '[ReportBehavior] Create Report': {
                const typedAction = action as {
                    interfaceSignallerKey: string | null;
                };
                typedAction.interfaceSignallerKey = null;
                break;
            }
        }
        return true;
    },
    state: (state) => {
        const typedState = state as ExerciseState;

        // Add `sent`-property to `AlarmGroup`
        Object.values(typedState.alarmGroups).forEach((alarmGroup) => {
            alarmGroup.sent = typedState.eocLog.some((logEntry) =>
                // This is not bullet-proof, but the best we can do
                logEntry.message.startsWith(
                    `Alarmgruppe ${alarmGroup.name} wurde alarmiert`
                )
            );
        });

        // Rename `key` to `resourceRequestKey` on `ResourceRequestRadiogram`
        forEachRadiogram(typedState, (radiogram) => {
            if (radiogram.type === 'resourceRequestRadiogram') {
                radiogram.resourceRequestKey = radiogram.key!;
                delete radiogram.key;
            }
        });

        // Add `interfaceSignallerKey` to `StartCollectingInformationEvent`
        forEachEvent(typedState, (event) => {
            if (event.type === 'startCollectingInformationEvent')
                event.interfaceSignallerKey = null;
        });

        // Add new properties to `ResourceRequestRadiogram`
        forEachRadiogram(typedState, (radiogram) => {
            if (radiogram.type === 'resourceRequestRadiogram') {
                radiogram.requiredResource = {
                    type: 'vehicleResource',
                    vehicleCounts: {},
                };
                radiogram.alreadyPromisedResource = null;

                // This is the "original" behavior of the radiogram (actively requesting resources)
                radiogram.canBeGranted = true;
            }
        });

        // Add `key` to radiograms
        forEachRadiogram(typedState, (radiogram) => {
            radiogram.informationRequestKey = null;
        });
    },
};

function forEachRadiogram(
    state: ExerciseState,
    fn: (radiogram: ExerciseRadiogram) => void
) {
    Object.values(state.radiograms).forEach(fn);
    Object.values(state.simulatedRegions).forEach((simulatedRegion) =>
        Object.values(simulatedRegion.activities).forEach((activityState) => {
            if (
                activityState.type === 'generateReportActivity' ||
                activityState.type === 'publishRadiogramActivity'
            )
                fn(activityState.radiogram);
        })
    );
}

function forEachEvent(
    state: ExerciseState,
    fn: (event: ExerciseSimulationEvent) => void
) {
    Object.values(state.simulatedRegions).forEach((simulatedRegion) => {
        simulatedRegion.inEvents.forEach(fn);
        Object.values(simulatedRegion.activities).forEach((activityState) => {
            if (
                activityState.type === 'delayEventActivity' ||
                activityState.type === 'recurringEventActivity' ||
                activityState.type === 'sendRemoteEventActivity'
            )
                fn(activityState.event);
            else if (activityState.type === 'generateReportActivity')
                fn(activityState.collectEvent);
        });
    });
}
