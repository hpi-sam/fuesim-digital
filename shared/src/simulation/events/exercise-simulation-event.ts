import type { ZodType } from 'zod';
import { z } from 'zod';
import { materialAvailableEventSchema } from './material-available.js';
import { newPatientEventSchema } from './new-patient.js';
import { personnelAvailableEventSchema } from './personnel-available.js';
import { tickEventSchema } from './tick.js';
import { vehicleArrivedEventSchema } from './vehicle-arrived.js';
import { treatmentsTimerEventSchema } from './treatments-timer-event.js';
import { treatmentProgressChangedEventSchema } from './treatment-progress-changed.js';
import { collectInformationEventSchema } from './collect.js';
import { startCollectingInformationSchema } from './start-collecting.js';
import { resourceRequiredEventSchema } from './resources-required.js';
import { vehiclesSentEventSchema } from './vehicles-sent.js';
import { tryToDistributeEventSchema } from './try-to-distribute.js';
import { vehicleTransferSuccessfulEventSchema } from './vehicle-transfer-successful.js';
import { transferConnectionMissingEventSchema } from './transfer-connection-missing.js';
import { sendRequestEventSchema } from './send-request.js';
import { leaderChangedEventSchema } from './leader-changed.js';
import { materialRemovedEventSchema } from './material-removed.js';
import { personnelRemovedEventSchema } from './personnel-removed.js';
import { patientRemovedEventSchema } from './patient-removed.js';
import { vehicleRemovedEventSchema } from './vehicle-removed.js';
import { transferPatientsInSpecificVehicleRequestEventSchema } from './transfer-patients-in-specific-vehicle-request.js';
import { transferSpecificVehicleRequestEventSchema } from './transfer-specific-vehicle-request.js';
import { transferVehiclesRequestEventSchema } from './transfer-vehicles-request.js';
import { transferPatientsRequestEventSchema } from './transfer-patients-request.js';
import { requestReceivedEventSchema } from './request-received.js';
import { startTransferEventSchema } from './start-transfer.js';
import { doTransferEventSchema } from './do-transfer.js';
import { patientTransferToHospitalSuccessfulEventSchema } from './patient-transfer-to-hospital-successful.js';
import { patientCategoryTransferToHospitalFinishedEventSchema } from './patient-category-transfer-to-hospital-finished.js';
import { tryToSendToHospitalEventSchema } from './try-to-send-to-hospital.js';
import { askForPatientDataEventSchema } from './ask-for-patient-data-event.js';
import { patientsCountedEventSchema } from './patients-counted.js';

export const exerciseSimulationEventSchema = z.discriminatedUnion('type', [
    materialAvailableEventSchema,
    newPatientEventSchema,
    personnelAvailableEventSchema,
    tickEventSchema,
    treatmentProgressChangedEventSchema,
    treatmentsTimerEventSchema,
    vehicleArrivedEventSchema,
    collectInformationEventSchema,
    startCollectingInformationSchema,
    resourceRequiredEventSchema,
    vehiclesSentEventSchema,
    tryToDistributeEventSchema,
    vehicleTransferSuccessfulEventSchema,
    transferConnectionMissingEventSchema,
    sendRequestEventSchema,
    leaderChangedEventSchema,
    materialRemovedEventSchema,
    personnelRemovedEventSchema,
    patientRemovedEventSchema,
    vehicleRemovedEventSchema,
    transferPatientsInSpecificVehicleRequestEventSchema,
    transferSpecificVehicleRequestEventSchema,
    transferVehiclesRequestEventSchema,
    transferPatientsRequestEventSchema,
    requestReceivedEventSchema,
    startTransferEventSchema,
    doTransferEventSchema,
    patientCategoryTransferToHospitalFinishedEventSchema,
    patientTransferToHospitalSuccessfulEventSchema,
    tryToSendToHospitalEventSchema,
    askForPatientDataEventSchema,
    patientsCountedEventSchema,
]);

export type ExerciseSimulationEvent = z.infer<
    typeof exerciseSimulationEventSchema
>;

type ExerciseSimulationEventDictionary = {
    [EventType in ExerciseSimulationEvent as EventType['type']]: ZodType<EventType>;
};

export const simulationEventDictionary: ExerciseSimulationEventDictionary = {
    materialAvailableEvent: materialAvailableEventSchema,
    newPatientEvent: newPatientEventSchema,
    personnelAvailableEvent: personnelAvailableEventSchema,
    tickEvent: tickEventSchema,
    treatmentProgressChangedEvent: treatmentProgressChangedEventSchema,
    treatmentsTimerEvent: treatmentsTimerEventSchema,
    vehicleArrivedEvent: vehicleArrivedEventSchema,
    collectInformationEvent: collectInformationEventSchema,
    startCollectingInformationEvent: startCollectingInformationSchema,
    resourceRequiredEvent: resourceRequiredEventSchema,
    vehiclesSentEvent: vehiclesSentEventSchema,
    tryToDistributeEvent: tryToDistributeEventSchema,
    vehicleTransferSuccessfulEvent: vehicleTransferSuccessfulEventSchema,
    transferConnectionMissingEvent: transferConnectionMissingEventSchema,
    sendRequestEvent: sendRequestEventSchema,
    leaderChangedEvent: leaderChangedEventSchema,
    materialRemovedEvent: materialRemovedEventSchema,
    personnelRemovedEvent: personnelRemovedEventSchema,
    patientRemovedEvent: patientRemovedEventSchema,
    vehicleRemovedEvent: vehicleRemovedEventSchema,
    transferPatientsInSpecificVehicleRequestEvent:
        transferPatientsInSpecificVehicleRequestEventSchema,
    transferSpecificVehicleRequestEvent:
        transferSpecificVehicleRequestEventSchema,
    transferVehiclesRequestEvent: transferVehiclesRequestEventSchema,
    transferPatientsRequestEvent: transferPatientsRequestEventSchema,
    requestReceivedEvent: requestReceivedEventSchema,
    startTransferEvent: startTransferEventSchema,
    doTransferEvent: doTransferEventSchema,
    patientCategoryTransferToHospitalFinishedEvent:
        patientCategoryTransferToHospitalFinishedEventSchema,
    patientTransferToHospitalSuccessfulEvent:
        patientTransferToHospitalSuccessfulEventSchema,
    tryToSendToHospitalEvent: tryToSendToHospitalEventSchema,
    askForPatientDataEvent: askForPatientDataEventSchema,
    patientsCountedEvent: patientsCountedEventSchema,
};
