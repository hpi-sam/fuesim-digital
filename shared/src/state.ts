import { Type } from 'class-transformer';
import {
    Equals,
    IsArray,
    IsInt,
    IsObject,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { defaultMaterialTemplates } from './data/default-state/material-templates.js';
import { defaultPersonnelTemplates } from './data/default-state/personnel-templates.js';
import {
    AlarmGroup,
    Client,
    EocLogEntry,
    Hospital,
    HospitalPatient,
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
} from './models/index.js';
import { ExerciseConfiguration } from './models/exercise-configuration.js';
import type { MaterialTemplate } from './models/material-template.js';
import type { PersonnelTemplate } from './models/personnel-template.js';
import type { ExerciseRadiogram } from './models/radiogram/exercise-radiogram.js';
import { getRadiogramConstructor } from './models/radiogram/exercise-radiogram.js';
import type { PersonnelType, ExerciseStatus } from './models/utils/index.js';
import {
    exerciseStatusAllowedValues,
    getCreate,
    SpatialTree,
} from './models/utils/index.js';
import type { MaterialType } from './models/utils/material-type.js';
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
} from './data/default-state/catch-all-hospital.js';
import { defaultPatientCategories } from './data/default-state/patient-templates.js';
import { defaultVehicleTemplates } from './data/default-state/vehicle-templates.js';
import { defaultMapImagesTemplates } from './data/default-state/map-images-templates.js';
import type { LogEntry } from './models/log-entry.js';
import type { TreatmentAssignment } from './store/action-reducers/exercise.js';

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

    @IsIdMap(Viewport)
    public readonly viewports: { readonly [key: UUID]: Viewport } = {};
    @IsIdMap(SimulatedRegion)
    public readonly simulatedRegions: {
        readonly [key: UUID]: SimulatedRegion;
    } = {};
    @IsIdMap(Vehicle)
    public readonly vehicles: { readonly [key: UUID]: Vehicle } = {};
    @IsIdMap(Personnel)
    public readonly personnel: { readonly [key: UUID]: Personnel } = {};
    @IsIdMap(Patient)
    public readonly patients: { readonly [key: UUID]: Patient } = {};
    @IsIdMap(Material)
    public readonly materials: { readonly [key: UUID]: Material } = {};
    @IsIdMap(MapImage)
    public readonly mapImages: { readonly [key: UUID]: MapImage } = {};
    @IsIdMap(TransferPoint)
    public readonly transferPoints: { readonly [key: UUID]: TransferPoint } =
        {};
    @IsIdMap(Hospital)
    public readonly hospitals: { readonly [key: UUID]: Hospital } = {
        [catchAllHospitalId]: createCatchAllHospital(),
    };
    @IsIdMap(HospitalPatient, (hospitalPatient) => hospitalPatient.patientId)
    public readonly hospitalPatients: {
        readonly [key: UUID]: HospitalPatient;
    } = {};
    @IsIdMap(AlarmGroup)
    public readonly alarmGroups: { readonly [key: UUID]: AlarmGroup } = {};
    @IsIdMap(Client)
    public readonly clients: { readonly [key: UUID]: Client } = {};
    @IsMultiTypedIdMap(getRadiogramConstructor)
    @ValidateNested()
    public readonly radiograms: { readonly [key: UUID]: ExerciseRadiogram } =
        {};
    @IsArray()
    @ValidateNested()
    @Type(() => PatientCategory)
    public readonly patientCategories = defaultPatientCategories;
    @IsArray()
    @ValidateNested()
    @Type(() => VehicleTemplate)
    public readonly vehicleTemplates = defaultVehicleTemplates;
    @IsObject()
    public readonly materialTemplates: {
        [Key in MaterialType]: MaterialTemplate;
    } = defaultMaterialTemplates;
    @IsObject()
    public readonly personnelTemplates: {
        [Key in PersonnelType]: PersonnelTemplate;
    } = defaultPersonnelTemplates;
    @IsArray()
    @ValidateNested()
    @Type(() => MapImageTemplate)
    public readonly mapImageTemplates = defaultMapImagesTemplates;
    @IsArray()
    @ValidateNested()
    @Type(() => EocLogEntry)
    public readonly eocLog: readonly EocLogEntry[] = [];
    @IsString()
    public readonly participantId: string;

    // Mutable<ExerciseState>` could still have immutable objects in spatialTree
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
    constructor(participantId: string) {
        this.participantId = participantId;
    }

    static readonly create = getCreate(this);

    /**
     * **Important**
     *
     * This number MUST be increased every time a change to any object (that is part of the state or the state itself) is made in a way that there may be states valid before that are no longer valid.
     */
    static readonly currentStateVersion = 41;
}
