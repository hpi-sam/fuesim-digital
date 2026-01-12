import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { difference } from 'lodash-es';
import {
    type ExerciseOccupation,
    newSimulatedRegionPositionIn,
    newVehiclePositionIn,
    exerciseOccupationSchema,
    changeOccupation,
    createVehicleActionTag,
    getCreate,
    isInSpecificSimulatedRegion,
    newIntermediateOccupation,
} from '../../models/index.js';
import type { UUID, UUIDSet } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import {
    IsLiteralUnion,
    IsUUIDSet,
    IsValue,
} from '../../utils/validators/index.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeAllowedValues } from '../utils/transfer-destination.js';
import {
    getElement,
    tryGetElement,
} from '../../store/action-reducers/utils/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import {
    MaterialRemovedEvent,
    NewPatientEvent,
    PatientRemovedEvent,
    PersonnelRemovedEvent,
    StartTransferEvent,
} from '../events/index.js';
import { completelyLoadVehicle } from '../../store/action-reducers/utils/completely-load-vehicle.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import { logVehicle } from '../../store/action-reducers/utils/log.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import type {
    SimulationActivity,
    SimulationActivityState,
} from './simulation-activity.js';

export class LoadVehicleActivityState implements SimulationActivityState {
    @IsValue('loadVehicleActivity' as const)
    public readonly type = 'loadVehicleActivity';

    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID;

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId: UUID;

    @IsLiteralUnion(transferDestinationTypeAllowedValues)
    readonly transferDestinationType: TransferDestination;

    @IsUUID(4, uuidValidationOptions)
    readonly transferDestinationId: UUID;

    @IsUUIDSet()
    public readonly patientsToBeLoaded: UUIDSet;

    @IsInt()
    @Min(0)
    @IsOptional()
    public readonly loadDelay?: number = undefined;

    @IsInt()
    @Min(0)
    public readonly loadTimePerPatient: number;

    @IsInt()
    @Min(0)
    public readonly personnelLoadTime: number;

    @IsOptional()
    @IsString()
    public readonly key?: string;

    @IsBoolean()
    public readonly hasBeenStarted: boolean = false;

    @IsInt()
    @Min(0)
    public readonly startTime: number = 0;

    @IsZodSchema(exerciseOccupationSchema.optional())
    readonly successorOccupation?: ExerciseOccupation;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        id: UUID,
        vehicleId: UUID,
        transferDestinationType: TransferDestination,
        transferDestinationId: UUID,
        patientsToBeLoaded: UUIDSet,
        loadTimePerPatient: number,
        personnelLoadTime: number,
        key?: string,
        successorOccupation?: ExerciseOccupation
    ) {
        this.id = id;
        this.vehicleId = vehicleId;
        this.transferDestinationType = transferDestinationType;
        this.transferDestinationId = transferDestinationId;
        this.patientsToBeLoaded = patientsToBeLoaded;
        this.loadTimePerPatient = loadTimePerPatient;
        this.personnelLoadTime = personnelLoadTime;
        this.key = key;
        this.successorOccupation = successorOccupation;
    }

    static readonly create = getCreate(this);
}

export const loadVehicleActivity: SimulationActivity<LoadVehicleActivityState> =
    {
        activityState: LoadVehicleActivityState,
        tick(
            draftState,
            simulatedRegion,
            activityState,
            tickInterval,
            terminate
        ) {
            const vehicle = tryGetElement(
                draftState,
                'vehicle',
                activityState.vehicleId
            );
            if (
                vehicle === undefined ||
                !isInSpecificSimulatedRegion(vehicle, simulatedRegion.id) ||
                vehicle.occupation.type !== 'loadOccupation' ||
                vehicle.occupation.loadingActivityId !== activityState.id
            ) {
                terminate();
                return;
            }

            // Start load process only once
            if (!activityState.hasBeenStarted) {
                // Send remove events

                let personnelToLoadCount = 0;
                Object.keys(vehicle.personnelIds).forEach((personnelId) => {
                    const personnel = getElement(
                        draftState,
                        'personnel',
                        personnelId
                    );
                    if (
                        isInSpecificSimulatedRegion(
                            personnel,
                            simulatedRegion.id
                        )
                    ) {
                        sendSimulationEvent(
                            simulatedRegion,
                            PersonnelRemovedEvent.create(personnelId)
                        );
                        personnelToLoadCount++;
                    }
                });
                Object.keys(vehicle.materialIds).forEach((materialId) => {
                    const material = getElement(
                        draftState,
                        'material',
                        materialId
                    );
                    if (
                        isInSpecificSimulatedRegion(
                            material,
                            simulatedRegion.id
                        )
                    ) {
                        sendSimulationEvent(
                            simulatedRegion,
                            MaterialRemovedEvent.create(materialId)
                        );
                    }
                });
                Object.keys(activityState.patientsToBeLoaded).forEach(
                    (patientId) => {
                        const patient = getElement(
                            draftState,
                            'patient',
                            patientId
                        );
                        if (
                            isInSpecificSimulatedRegion(
                                patient,
                                simulatedRegion.id
                            )
                        ) {
                            sendSimulationEvent(
                                simulatedRegion,
                                PatientRemovedEvent.create(patientId)
                            );
                        }
                    }
                );

                // Load material and personnel

                completelyLoadVehicle(draftState, vehicle);

                // Load patients (and unload patients not to be loaded)

                const patientsToUnload = difference(
                    Object.keys(vehicle.patientIds),
                    Object.keys(activityState.patientsToBeLoaded)
                );
                const patientsToLoad = difference(
                    Object.keys(activityState.patientsToBeLoaded),
                    Object.keys(vehicle.patientIds)
                );

                patientsToUnload.forEach((patientId) => {
                    changePositionWithId(
                        patientId,
                        newSimulatedRegionPositionIn(simulatedRegion.id),
                        'patient',
                        draftState
                    );

                    // Inform the region that a new patient has left the vehicle
                    sendSimulationEvent(
                        simulatedRegion,
                        NewPatientEvent.create(patientId)
                    );
                });

                vehicle.patientIds = cloneDeepMutable(
                    activityState.patientsToBeLoaded
                );

                patientsToLoad.forEach((patientId) => {
                    changePositionWithId(
                        patientId,
                        newVehiclePositionIn(vehicle.id),
                        'patient',
                        draftState
                    );
                });

                const patientMovementsCount =
                    patientsToUnload.length + patientsToLoad.length;

                // Personnel has to leave and reenter the vehicle if patients are unloaded or loaded
                const personnelLoadingRequired =
                    personnelToLoadCount > 0 || patientMovementsCount > 0;

                // Calculate loading time based on the patients and personnel to be loaded
                // Do not do the calculation if the time is already set (which could occur if an instance of this activity was imported from an older state version)
                activityState.loadDelay ??=
                    patientMovementsCount * activityState.loadTimePerPatient +
                    (personnelLoadingRequired
                        ? activityState.personnelLoadTime
                        : 0);

                activityState.hasBeenStarted = true;
                activityState.startTime = draftState.currentTime;
            }

            if (
                activityState.loadDelay !== undefined &&
                activityState.startTime + activityState.loadDelay <=
                    draftState.currentTime
            ) {
                sendSimulationEvent(
                    simulatedRegion,
                    StartTransferEvent.create(
                        activityState.vehicleId,
                        activityState.transferDestinationType,
                        activityState.transferDestinationId,
                        activityState.key,
                        cloneDeepMutable(activityState.successorOccupation)
                    )
                );

                logVehicle(
                    draftState,
                    [createVehicleActionTag(draftState, 'loaded')],
                    `${vehicle.name} wurde automatisch beladen`,
                    vehicle.id
                );

                changeOccupation(
                    draftState,
                    vehicle,
                    newIntermediateOccupation(
                        draftState.currentTime + tickInterval
                    )
                );

                terminate();
            }
        },
    };
