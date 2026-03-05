import { Type } from 'class-transformer';
import * as z from 'zod';
import {
    Equals,
    IsArray,
    IsInt,
    IsObject,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { defaultMaterialTemplatesById } from './data/default-state/material-templates.js';
import { defaultPersonnelTemplatesById } from './data/default-state/personnel-templates.js';
import {
    AlarmGroup,
    Client,
    EocLogEntry,
    Hospital,
    HospitalPatient,
    RestrictedZone,
    MapImage,
    MapImageTemplate,
    Material,
    Patient,
    PatientCategory,
    Personnel,
    SimulatedRegion,
    TransferPoint,
    Vehicle,
    VehicleTemplate,
    Viewport,
    ExerciseConfiguration,
    exerciseStatusAllowedValues,
    getCreate,
    SpatialTree,
    MaterialTemplate,
    PersonnelTemplate,
} from './models/index.js';
import type { ExerciseStatus, LogEntry } from './models/index.js';
import type { ExerciseRadiogram } from './models/radiogram/index.js';
import { getRadiogramConstructor } from './models/radiogram/index.js';
import {
    RandomState,
    seededRandomState,
} from './simulation/utils/randomness.js';
import type { SpatialElementPlural } from './store/action-reducers/utils/spatial-elements.js';
import type { UUID } from './utils/index.js';
import { uuid, uuidValidationOptions } from './utils/index.js';
import {
    IsIdMap,
    IsLiteralUnion,
    IsMultiTypedIdMap,
} from './utils/validators/index.js';
import {
    createCatchAllHospital,
    catchAllHospitalId,
    defaultPatientCategories,
    defaultMapImagesTemplatesById,
} from './data/index.js';
import { IsZodSchema } from './utils/validators/is-zod-object.js';
import { vehicleSchema } from './models/vehicle.js';
import { defaultVehicleTemplatesById } from './data/default-state/vehicle-templates.js';
import type { TreatmentAssignment } from './store/index.js';
import { restrictedZoneSchema } from './models/restricted-zone.js';
import { materialSchema } from './models/material.js';
import { materialTemplateSchema } from './models/material-template.js';
import { personnelTemplateSchema } from './models/personnel-template.js';
import { personnelSchema } from './models/personnel.js';
import { vehicleTemplateSchema } from './models/vehicle-template.js';
import { type ParticipantKey, participantKeySchema } from './exercise-keys.js';
import { hospitalSchema } from './models/hospital.js';
import { mapImageTemplateSchema } from './models/map-image-template.js';
import { mapImageSchema } from './models/map-image.js';
import { viewportSchema } from './models/viewport.js';
import { transferPointSchema } from './models/transfer-point.js';
import { alarmGroupSchema } from './models/alarm-group.js';
import { clientSchema } from './models/client.js';
import { eocLogEntrySchema } from './models/eoc-log-entry.js';

export class ExerciseState {
    @IsUUID(4, uuidValidationOptions)
    public readonly id = uuid();
    /**
     * The number of ms since the start of the exercise.
     * This time is updated each `tick` by a constant value, is guaranteed to be (a bit) slower than the real time
     * (depending on the server load and overhead of the tick).
     *
     * It is guaranteed that the `ExerciseTickAction` is the only action that modifies this value.
     */
    @IsInt()
    @Min(0)
    public readonly currentTime: number = 0;
    @IsLiteralUnion(exerciseStatusAllowedValues)
    public readonly currentStatus: ExerciseStatus = 'notStarted';

    @Type(() => RandomState)
    @ValidateNested()
    public readonly randomState: RandomState = seededRandomState();

    @IsZodSchema(z.record(z.uuidv4(), viewportSchema))
    public readonly viewports: { readonly [key: UUID]: Viewport } = {};
    @IsIdMap(SimulatedRegion)
    public readonly simulatedRegions: {
        readonly [key: UUID]: SimulatedRegion;
    } = {};

    @IsZodSchema(z.record(z.uuidv4(), vehicleSchema))
    public readonly vehicles: { readonly [key: UUID]: Vehicle } = {};

    @IsZodSchema(z.record(z.uuidv4(), personnelSchema))
    public readonly personnel: { readonly [key: UUID]: Personnel } = {};
    @IsIdMap(Patient)
    public readonly patients: { readonly [key: UUID]: Patient } = {};
    @IsZodSchema(z.record(z.uuidv4(), materialSchema))
    public readonly materials: { readonly [key: UUID]: Material } = {};
    @IsZodSchema(z.record(z.uuidv4(), restrictedZoneSchema))
    public readonly restrictedZones: { readonly [key: UUID]: RestrictedZone } =
        {};
    @IsZodSchema(z.record(z.uuidv4(), mapImageSchema))
    public readonly mapImages: { readonly [key: UUID]: MapImage } = {};
    @IsZodSchema(z.record(z.uuidv4(), transferPointSchema))
    public readonly transferPoints: { readonly [key: UUID]: TransferPoint } =
        {};
    @IsZodSchema(z.record(z.uuidv4(), hospitalSchema))
    public readonly hospitals: { readonly [key: UUID]: Hospital } = {
        [catchAllHospitalId]: createCatchAllHospital(),
    };
    @IsIdMap(HospitalPatient, (hospitalPatient) => hospitalPatient.patientId)
    public readonly hospitalPatients: {
        readonly [key: UUID]: HospitalPatient;
    } = {};
    @IsZodSchema(z.record(z.uuidv4(), alarmGroupSchema))
    public readonly alarmGroups: { readonly [key: UUID]: AlarmGroup } = {};
    @IsZodSchema(z.record(z.uuidv4(), clientSchema))
    public readonly clients: { readonly [key: UUID]: Client } = {};
    @IsMultiTypedIdMap(getRadiogramConstructor)
    @ValidateNested()
    public readonly radiograms: { readonly [key: UUID]: ExerciseRadiogram } =
        {};
    @IsArray()
    @ValidateNested()
    @Type(() => PatientCategory)
    public readonly patientCategories = defaultPatientCategories;

    @IsZodSchema(z.record(z.uuidv4(), vehicleTemplateSchema))
    public readonly vehicleTemplates: {
        readonly [key: UUID]: VehicleTemplate;
    } = defaultVehicleTemplatesById;
    @IsZodSchema(z.record(z.uuidv4(), materialTemplateSchema))
    public readonly materialTemplates: {
        readonly [key: UUID]: MaterialTemplate;
    } = defaultMaterialTemplatesById;
    @IsZodSchema(z.record(z.uuidv4(), personnelTemplateSchema))
    public readonly personnelTemplates: {
        readonly [key: UUID]: PersonnelTemplate;
    } = defaultPersonnelTemplatesById;
    @IsZodSchema(z.record(z.uuidv4(), mapImageTemplateSchema))
    public readonly mapImageTemplates: {
        readonly [key: UUID]: MapImageTemplate;
    } = defaultMapImagesTemplatesById;

    @IsZodSchema(z.array(eocLogEntrySchema))
    public readonly eocLog: readonly EocLogEntry[] = [];

    @IsZodSchema(participantKeySchema)
    public readonly participantKey: ParticipantKey;

    // WritableDraft<ExerciseState>` could still have immutable objects in spatialTree
    @IsObject()
    public readonly spatialTrees: {
        [type in SpatialElementPlural]: SpatialTree;
    } = {
        materials: SpatialTree.create(),
        patients: SpatialTree.create(),
        personnel: SpatialTree.create(),
    };

    @ValidateNested()
    @Type(() => ExerciseConfiguration)
    public readonly configuration = ExerciseConfiguration.create();

    @IsInt()
    @Min(0)
    public readonly patientCounter: number = 0;

    /**
     * The log entries generated for the statistics.
     * This must not be defined on a normal state,
     * unless the statistics are currently being generated.
     */
    @Equals(undefined)
    public logEntries?: LogEntry[];

    @Equals(undefined)
    public previousTreatmentAssignment?: TreatmentAssignment;

    /**
     * @deprecated Use {@link create} instead.
     */
    constructor(participantKey: ParticipantKey) {
        this.participantKey = participantKey;
    }

    static readonly create = getCreate(this);

    /**
     * **Important**
     *
     * This number MUST be increased every time a change to any object (that is part of the state or the state itself) is made in a way that there may be states valid before that are no longer valid.
     */
    static readonly currentStateVersion = 47;
}
