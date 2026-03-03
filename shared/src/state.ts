import * as z from 'zod';
import {
    Equals,
    IsObject,
    IsOptional,
    IsUUID,
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
    Personnel,
    SimulatedRegion,
    TransferPoint,
    Vehicle,
    VehicleTemplate,
    Viewport,
    ExerciseConfiguration,
    getCreate,
    SpatialTree,
    MaterialTemplate,
    PersonnelTemplate,
    exerciseStatusSchema,
} from './models/index.js';
import type { ExerciseStatus, LogEntry } from './models/index.js';
import type { ExerciseRadiogram } from './models/radiogram/index.js';
import { getRadiogramConstructor } from './models/radiogram/index.js';
import {
    newSeededRandomState,
    type RandomState,
    randomStateSchema,
} from './simulation/utils/randomness.js';
import type { SpatialElementPlural } from './store/action-reducers/utils/spatial-elements.js';
import type { UUID } from './utils/index.js';
import { uuid, uuidValidationOptions } from './utils/index.js';
import { IsIdMap, IsMultiTypedIdMap } from './utils/validators/index.js';
import {
    UUID,
    uuidSchema,
    uuid,
    uuidValidationOptions,
} from './utils/index.js';
import { IsIdMap, IsMultiTypedIdMap } from './utils/validators/index.js';
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
import {
    exerciseConfigurationSchema,
    newExerciseConfiguration,
} from './models/exercise-configuration.js';
import { patientSchema } from './models/patient.js';
import { hospitalPatientSchema } from './models/hospital-patient.js';
import { patientCategorySchema } from './models/patient-category.js';

export class ExerciseState {
    @IsZodSchema(uuidSchema)
    public readonly id = uuid();
    /**
     * The number of ms since the start of the exercise.
     * This time is updated each `tick` by a constant value, is guaranteed to be (a bit) slower than the real time
     * (depending on the server load and overhead of the tick).
     *
     * It is guaranteed that the `ExerciseTickAction` is the only action that modifies this value.
     */
    @IsZodSchema(z.int().nonnegative())
    public readonly currentTime: number = 0;

    @IsZodSchema(exerciseStatusSchema)
    public readonly currentStatus: ExerciseStatus = 'notStarted';

    @IsZodSchema(randomStateSchema)
    public readonly randomState: RandomState = newSeededRandomState();

    @IsZodSchema(z.record(uuidSchema, viewportSchema))
    public readonly viewports: { readonly [key: UUID]: Viewport } = {};

    @IsUUID(4, uuidValidationOptions)
    @IsOptional()
    public readonly autojoinViewportId: UUID | null = null;

    @IsIdMap(SimulatedRegion)
    public readonly simulatedRegions: {
        readonly [key: UUID]: SimulatedRegion;
    } = {};

    @IsZodSchema(z.record(uuidSchema, vehicleSchema))
    public readonly vehicles: { readonly [key: UUID]: Vehicle } = {};

    @IsZodSchema(z.record(uuidSchema, personnelSchema))
    public readonly personnel: { readonly [key: UUID]: Personnel } = {};

    @IsZodSchema(z.record(uuidSchema, patientSchema))
    public readonly patients: { readonly [key: UUID]: Patient } = {};

    @IsZodSchema(z.record(uuidSchema, materialSchema))
    public readonly materials: { readonly [key: UUID]: Material } = {};

    @IsZodSchema(z.record(uuidSchema, restrictedZoneSchema))
    public readonly restrictedZones: { readonly [key: UUID]: RestrictedZone } =
        {};

    @IsZodSchema(z.record(uuidSchema, mapImageSchema))
    public readonly mapImages: { readonly [key: UUID]: MapImage } = {};

    @IsZodSchema(z.record(uuidSchema, transferPointSchema))
    public readonly transferPoints: { readonly [key: UUID]: TransferPoint } =
        {};

    @IsZodSchema(z.record(uuidSchema, hospitalSchema))
    public readonly hospitals: { readonly [key: UUID]: Hospital } = {
        [catchAllHospitalId]: createCatchAllHospital(),
    };

    @IsZodSchema(z.record(uuidSchema, hospitalPatientSchema))
    public readonly hospitalPatients: {
        readonly [key: UUID]: HospitalPatient;
    } = {};

    @IsZodSchema(z.record(uuidSchema, alarmGroupSchema))
    public readonly alarmGroups: { readonly [key: UUID]: AlarmGroup } = {};

    @IsZodSchema(z.record(uuidSchema, clientSchema))
    public readonly clients: { readonly [key: UUID]: Client } = {};

    @IsZodSchema(z.array(z.string()))
    public readonly clientNames: string[] = [];

    @IsMultiTypedIdMap(getRadiogramConstructor)
    @ValidateNested()
    public readonly radiograms: { readonly [key: UUID]: ExerciseRadiogram } =
        {};

    @IsZodSchema(z.array(patientCategorySchema))
    public readonly patientCategories = defaultPatientCategories;

    @IsZodSchema(z.record(uuidSchema, vehicleTemplateSchema))
    public readonly vehicleTemplates: {
        readonly [key: UUID]: VehicleTemplate;
    } = defaultVehicleTemplatesById;

    @IsZodSchema(z.record(uuidSchema, materialTemplateSchema))
    public readonly materialTemplates: {
        readonly [key: UUID]: MaterialTemplate;
    } = defaultMaterialTemplatesById;

    @IsZodSchema(z.record(uuidSchema, personnelTemplateSchema))
    public readonly personnelTemplates: {
        readonly [key: UUID]: PersonnelTemplate;
    } = defaultPersonnelTemplatesById;

    @IsZodSchema(z.record(uuidSchema, mapImageTemplateSchema))
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

    @IsZodSchema(exerciseConfigurationSchema)
    public readonly configuration = newExerciseConfiguration();

    @IsZodSchema(z.int().nonnegative())
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
    static readonly currentStateVersion = 48;
}
