import { Type } from 'class-transformer';
import {
    IsUUID,
    ValidateNested,
    IsNumber,
    Max,
    Min,
    IsBoolean,
    IsString,
    MaxLength,
} from 'class-validator';
import { isEmpty } from 'lodash-es';
import type { UUID, UUIDSet } from '../utils/index.js';
import { uuidValidationOptions, uuid } from '../utils/index.js';
import {
    IsLiteralUnion,
    IsIdMap,
    IsUUIDSet,
    IsValue,
} from '../utils/validators/index.js';
import { IsZodSchema } from '../utils/validators/is-zod-object.js';
import { PatientHealthState } from './patient-health-state.js';
import type {
    Position,
    PatientStatus,
    ImageProperties,
    HealthPoints,
} from './utils/index.js';
import { PersonalInformation } from './utils/personal-information.js';
import { PretriageInformation } from './utils/pretriage-information.js';
import {
    BiometricInformation,
    PatientStatusCode,
    patientStatusAllowedValues,
    healthPointsDefaults,
    getCreate,
    isInSimulatedRegion,
    isOnMap,
    imagePropertiesSchema,
    IsPosition,
} from './utils/index.js';

export class Patient {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('patient')
    public readonly type = 'patient';

    @IsString()
    public readonly identifier: string = '';

    @IsString()
    public readonly customQRCode: string = '';

    @ValidateNested()
    @Type(() => PersonalInformation)
    public readonly personalInformation: PersonalInformation;

    @ValidateNested()
    @Type(() => BiometricInformation)
    public readonly biometricInformation: BiometricInformation;

    @ValidateNested()
    @Type(() => PretriageInformation)
    public readonly pretriageInformation: PretriageInformation;

    @IsBoolean()
    public readonly hasTransportPriority: boolean = false;
    /**
     * A description of the expected patient behaviour over time
     * For the trainer
     */
    @ValidateNested()
    @Type(() => PatientStatusCode)
    public readonly patientStatusCode: PatientStatusCode;

    @IsLiteralUnion(patientStatusAllowedValues)
    public readonly pretriageStatus: PatientStatus;

    @IsLiteralUnion(patientStatusAllowedValues)
    public readonly realStatus: PatientStatus;

    @IsZodSchema(imagePropertiesSchema)
    public readonly image: ImageProperties;

    /**
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @IsPosition()
    public readonly position: Position;

    /**
     * The time the patient already is in the current state
     */
    @IsNumber()
    public readonly stateTime: number = 0;

    @IsIdMap(PatientHealthState)
    public readonly healthStates: {
        readonly [stateId: UUID]: PatientHealthState;
    } = {};

    /**
     * The id of the current health state in {@link healthStates}
     */
    @IsUUID(4, uuidValidationOptions)
    public readonly currentHealthStateId: UUID;

    /**
     * See {@link HealthPoints} for context of this property.
     */
    @IsNumber()
    @Max(healthPointsDefaults.max)
    @Min(healthPointsDefaults.min)
    public readonly health: HealthPoints;

    @IsUUIDSet()
    public readonly assignedPersonnelIds: UUIDSet = {};

    @IsUUIDSet()
    public readonly assignedMaterialIds: UUIDSet = {};
    /**
     * The speed with which the patients healthStatus changes
     * if it is 0.5 every patient changes half as fast (slow motion)
     */
    @IsNumber()
    @Min(0)
    public readonly timeSpeed: number = 1;

    /**
     * Whether the {@link getVisibleStatus} of this patient has changed
     * since the last time it was updated which personnel and materials treat him/her.
     * Use this to prevent unnecessary recalculations for patients that didn't change -> performance optimization.
     */
    @IsBoolean()
    public readonly visibleStatusChanged: boolean = false;

    /**
     * This can be any arbitrary string. It gives trainers the freedom to add additional functionalities that are not natively supported by this application (like an hospital ticket system)
     */
    @IsString()
    @MaxLength(65535)
    public readonly remarks: string;

    @IsNumber()
    @Min(0)
    public treatmentTime = 0;

    /**
     * The time that is needed for personnel to automatically pretriage the patient
     * in milliseconds
     */
    public static readonly pretriageTimeThreshold: number = 60 * 1000; // 1 minute

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        // TODO: Specify patient data (e.g. injuries, name, etc.)
        personalInformation: PersonalInformation,
        biometricInformation: BiometricInformation,
        pretriageInformation: PretriageInformation,
        patientStatusCode: PatientStatusCode,
        pretriageStatus: PatientStatus,
        realStatus: PatientStatus,
        healthStates: { readonly [stateId: UUID]: PatientHealthState },
        currentHealthStateId: UUID,
        image: ImageProperties,
        health: HealthPoints,
        remarks: string,
        position: Position
    ) {
        this.personalInformation = personalInformation;
        this.biometricInformation = biometricInformation;
        this.pretriageInformation = pretriageInformation;
        this.patientStatusCode = patientStatusCode;
        this.pretriageStatus = pretriageStatus;
        this.realStatus = realStatus;
        this.healthStates = healthStates;
        this.currentHealthStateId = currentHealthStateId;
        this.image = image;
        this.health = health;
        this.remarks = remarks;
        this.position = position;
    }

    static readonly create = getCreate(this);

    static getVisibleStatus(
        patient: Patient,
        pretriageEnabled: boolean,
        bluePatientsEnabled: boolean
    ) {
        const status =
            !pretriageEnabled || Patient.pretriageStatusIsLocked(patient)
                ? patient.realStatus
                : patient.pretriageStatus;
        return status === 'blue' && !bluePatientsEnabled ? 'red' : status;
    }

    static pretriageStatusIsLocked(patient: Patient): boolean {
        return patient.treatmentTime >= this.pretriageTimeThreshold;
    }

    static isTreatedByPersonnel(patient: Patient) {
        return !isEmpty(patient.assignedPersonnelIds);
    }

    static canBeTreated(patient: Patient) {
        return isOnMap(patient) || isInSimulatedRegion(patient);
    }
}
