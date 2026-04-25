import { z } from 'zod';
import { Equals, IsObject, IsOptional, IsUUID } from 'class-validator';
import { defaultMaterialTemplatesById } from './data/default-state/material-templates.js';
import { defaultPersonnelTemplatesById } from './data/default-state/personnel-templates.js';
import {
    newSeededRandomState,
    type RandomState,
    randomStateSchema,
} from './simulation/utils/randomness.js';
import type { SpatialElementPlural } from './store/action-reducers/utils/spatial-elements.js';
import { IsZodSchema } from './utils/validators/is-zod-object.js';
import { Vehicle, vehicleSchema } from './models/vehicle.js';
import {
    RestrictedZone,
    restrictedZoneSchema,
} from './models/restricted-zone.js';
import { Material, materialSchema } from './models/material.js';
import { Personnel, personnelSchema } from './models/personnel.js';
import { type ParticipantKey, participantKeySchema } from './exercise-keys.js';
import {
    operationalSectionSchema,
    OperationalSection,
} from './models/operational-section.js';
import { Hospital, hospitalSchema } from './models/hospital.js';
import { type MapImage, mapImageSchema } from './models/map-image.js';
import { Viewport, viewportSchema } from './models/viewport.js';
import { TransferPoint, transferPointSchema } from './models/transfer-point.js';
import { type AlarmGroup, alarmGroupSchema } from './models/alarm-group.js';
import { Client, clientSchema } from './models/client.js';
import { type EocLogEntry, eocLogEntrySchema } from './models/eoc-log-entry.js';
import {
    exerciseConfigurationSchema,
    newExerciseConfiguration,
} from './models/exercise-configuration.js';
import { Patient, patientSchema } from './models/patient.js';
import {
    HospitalPatient,
    hospitalPatientSchema,
} from './models/hospital-patient.js';
import { patientCategorySchema } from './models/patient-category.js';
import { UUID, uuid, uuidSchema, uuidValidationOptions } from './utils/uuid.js';
import {
    catchAllHospitalId,
    createCatchAllHospital,
} from './data/default-state/catch-all-hospital.js';
import { defaultPatientCategories } from './data/default-state/patient-templates.js';
import { defaultMapImagesTemplatesById } from './data/default-state/map-images-templates.js';
import { SpatialTree } from './models/utils/spatial-tree.js';
import { type LogEntry, logEntrySchema } from './models/log-entry.js';
import type { TreatmentAssignment } from './store/action-reducers/exercise.js';
import { getCreate } from './models/utils/get-create.js';
import {
    type ExerciseStatus,
    exerciseStatusSchema,
    type ExerciseType,
    exerciseTypeSchema,
} from './models/utils/exercise-status.js';
import {
    type SimulatedRegion,
    simulatedRegionSchema,
} from './models/simulated-region.js';
import {
    type ExerciseRadiogram,
    exerciseRadiogramSchema,
} from './models/radiogram/exercise-radiogram.js';
import { type Scoutable, scoutableSchema } from './models/scoutable.js';
import {
    type TechnicalChallenge,
    technicalChallengeSchema,
} from './models/technical-challenge/technical-challenge.js';
import { type Task, taskSchema } from './models/task.js';
import { getDefaultTasks } from './data/default-state/tmp-default-technical-challenge.js';
import {
    VersionedCollectionPartial,
    versionedCollectionPartialSchema,
} from './marketplace/models/versioned-id-schema.js';
import { Template, templateSchema } from './models/template.js';
import { hybridIdSchema } from './utils/hybrid-id.js';

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

    @IsZodSchema(exerciseTypeSchema)
    public readonly type: ExerciseType = 'standalone';

    @IsZodSchema(exerciseStatusSchema)
    public readonly currentStatus: ExerciseStatus = 'notStarted';

    @IsZodSchema(randomStateSchema)
    public readonly randomState: RandomState = newSeededRandomState();

    @IsZodSchema(z.array(versionedCollectionPartialSchema))
    public readonly selectedCollections: VersionedCollectionPartial[] = [];

    @IsZodSchema(z.record(uuidSchema, viewportSchema))
    public readonly viewports: { readonly [key: UUID]: Viewport } = {};

    @IsUUID(4, uuidValidationOptions)
    @IsOptional()
    public readonly autojoinViewportId: UUID | null = null;

    @IsZodSchema(z.record(uuidSchema, simulatedRegionSchema))
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

    @IsZodSchema(z.record(taskSchema.shape.id, taskSchema))
    public tasks: { [key: UUID]: Task } = getDefaultTasks();

    @IsZodSchema(
        z.record(technicalChallengeSchema.shape.id, technicalChallengeSchema)
    )
    public technicalChallenges: { [key: UUID]: TechnicalChallenge } = {};

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

    /** All client names that are currently in the exercise or joined the exercise in the past */
    @IsZodSchema(z.array(z.string()))
    public readonly collectedClientNames: string[] = [];

    @IsZodSchema(z.record(uuidSchema, exerciseRadiogramSchema))
    public readonly radiograms: { readonly [key: UUID]: ExerciseRadiogram } =
        {};
    @IsZodSchema(z.record(uuidSchema, operationalSectionSchema))
    public readonly operationalSections: {
        readonly [key: UUID]: OperationalSection;
    } = {};

    @IsZodSchema(z.array(patientCategorySchema))
    public readonly patientCategories = defaultPatientCategories;

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
    @IsZodSchema(z.undefined())
    public logEntries?: LogEntry[];

    @IsZodSchema(z.optional(logEntrySchema))
    public lastLogEntry?: LogEntry;

    @Equals(undefined)
    public previousTreatmentAssignment?: TreatmentAssignment;

    @IsZodSchema(z.record(scoutableSchema.shape.id, scoutableSchema))
    public readonly scoutables: { readonly [key: UUID]: Scoutable } = {};

    @IsZodSchema(z.record(hybridIdSchema, templateSchema))
    public readonly templates: { readonly [key: UUID]: Template } = {
        ...defaultMaterialTemplatesById,
        ...defaultMapImagesTemplatesById,
        ...defaultPersonnelTemplatesById,
    };

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
     *
     * WARNING: Before incresing this number, make sure to check:
     * - If you made any changes to where/how references are stored in a model, please check
     *   if collection-service.ts/findEntitiyVersionsInContent() needs to be updated to detect the new references.
     */
    static readonly currentStateVersion = 53;
}
