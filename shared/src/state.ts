import { z } from 'zod';
import type { Immutable } from 'immer';
import { defaultMaterialTemplatesById } from './data/default-state/material-templates.js';
import { defaultPersonnelTemplatesById } from './data/default-state/personnel-templates.js';
import {
    newSeededRandomState,
    randomStateSchema,
} from './simulation/utils/randomness.js';
import { spatialElementTypePluralSchema } from './store/action-reducers/utils/spatial-elements.js';
import { vehicleSchema } from './models/vehicle.js';
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
import { operationalSectionSchema } from './models/operational-section.js';
import {
    exerciseConfigurationSchema,
    newExerciseConfiguration,
} from './models/exercise-configuration.js';
import { patientSchema } from './models/patient.js';
import { hospitalPatientSchema } from './models/hospital-patient.js';
import { patientCategorySchema } from './models/patient-category.js';
import { uuid, uuidSchema } from './utils/uuid.js';
import { defaultMapImagesTemplatesById } from './data/default-state/map-images-templates.js';
import { SpatialTree } from './models/utils/spatial-tree.js';
import { logEntrySchema } from './models/log-entry.js';
import {
    exerciseStatusSchema,
    exerciseTypeSchema,
} from './models/utils/exercise-status.js';
import {
    
    simulatedRegionSchema,
} from './models/simulated-region.js';
import {
    
    exerciseRadiogramSchema,
} from './models/radiogram/exercise-radiogram.js';
import {  scoutableSchema } from './models/scoutable.js';
import {
    
    measureSchema,
    measureTemplateCategorySchema,
} from './models/measure/measures.js';
import { drawingSchema } from './models/drawing.js';
import { defaultMeasureTemplateCategories } from './data/default-state/measure-templates.js';
import {
    
    technicalChallengeSchema,
} from './models/technical-challenge/technical-challenge.js';
import {  taskSchema } from './models/task.js';
import { getDefaultTasks } from './data/default-state/tmp-default-technical-challenge.js';
import { userGeneratedContentSchema } from './models/user-generated-content.js';
import { defaultVehicleTemplatesById } from './data/default-state/vehicle-templates.js';
import { resourceDescriptionSchema } from './models/utils/resource-description.js';
import { defaultPatientCategories } from './data/default-state/patient-templates.js';

/**
 * **Important**
 *
 * This number MUST be increased every time a change to any object (that is part of the state or the state itself) is made in a way that there may be states valid before that are no longer valid.
 */
export const currentStateVersion = 50 as const;

export const exerciseStateSchema = z.strictObject({
    id: uuidSchema,
    /**
     * The number of ms since the start of the exercise.
     * This time is updated each `tick` by a constant value, is guaranteed to be (a bit) slower than the real time
     * (depending on the server load and overhead of the tick).
     *
     * It is guaranteed that the `ExerciseTickAction` is the only action that modifies this value.
     */
    currentTime: z.int().nonnegative(),
    type: exerciseTypeSchema,
    currentStatus: exerciseStatusSchema,
    randomState: randomStateSchema,

    viewports: z.record(uuidSchema, viewportSchema),
    autojoinViewportId: uuidSchema.nullable(),

    simulatedRegions: z.record(uuidSchema, simulatedRegionSchema),

    vehicles: z.record(uuidSchema, vehicleSchema),
    personnel: z.record(uuidSchema, personnelSchema),
    patients: z.record(uuidSchema, patientSchema),
    materials: z.record(uuidSchema, materialSchema),

    restrictedZones: z.record(uuidSchema, restrictedZoneSchema),
    measures: z.record(measureSchema.shape.id, measureSchema),
    drawings: z.record(drawingSchema.shape.id, drawingSchema),

    mapImages: z.record(uuidSchema, mapImageSchema),

    tasks: z.record(taskSchema.shape.id, taskSchema),

    technicalChallenges: z.record(
        technicalChallengeSchema.shape.id,
        technicalChallengeSchema
    ),

    transferPoints: z.record(uuidSchema, transferPointSchema),

    hospitals: z.record(uuidSchema, hospitalSchema),
    hospitalPatients: z.record(uuidSchema, hospitalPatientSchema),
    alarmGroups: z.record(uuidSchema, alarmGroupSchema),

    clients: z.record(uuidSchema, clientSchema),
    /** All client names that are currently in the exercise or joined the exercise in the past */
    collectedClientNames: z.array(z.string()),

    radiograms: z.record(uuidSchema, exerciseRadiogramSchema),

    operationalSections: z.record(uuidSchema, operationalSectionSchema),

    patientCategories: z.array(patientCategorySchema),
    vehicleTemplates: z.record(uuidSchema, vehicleTemplateSchema),
    materialTemplates: z.record(uuidSchema, materialTemplateSchema),
    personnelTemplates: z.record(uuidSchema, personnelTemplateSchema),
    measureTemplates: z.record(z.string(), measureTemplateCategorySchema),
    mapImageTemplates: z.record(uuidSchema, mapImageTemplateSchema),

    scoutables: z.record(scoutableSchema.shape.id, scoutableSchema),

    userGeneratedContents: z.record(
        userGeneratedContentSchema.shape.id,
        userGeneratedContentSchema
    ),

    eocLog: z.array(eocLogEntrySchema),

    participantKey: participantKeySchema,

    spatialTrees: z.record(spatialElementTypePluralSchema, SpatialTree.schema),

    configuration: exerciseConfigurationSchema,
    patientCounter: z.int().nonnegative(),

    logEntries: z.array(logEntrySchema).optional(),
    lastLogEntry: logEntrySchema.optional(),

    previousTreatmentAssignment: z
        .record(uuidSchema, resourceDescriptionSchema)
        .optional(),

    currentStateVersion: z.literal(currentStateVersion),
});

export type ExerciseState = Immutable<z.infer<typeof exerciseStateSchema>>;

export function newExerciseState(
    participantKey: ParticipantKey
): ExerciseState {
    return {
        id: uuid(),
        currentTime: 0,
        type: 'standalone',
        currentStatus: 'notStarted',
        randomState: newSeededRandomState(),
        viewports: {},
        autojoinViewportId: null,
        simulatedRegions: {},
        vehicles: {},
        personnel: {},
        patients: {},
        materials: {},
        restrictedZones: {},
        measures: {},
        drawings: {},
        mapImages: {},
        tasks: getDefaultTasks(),
        technicalChallenges: {},
        transferPoints: {},
        hospitals: {},
        hospitalPatients: {},
        alarmGroups: {},
        clients: {},
        collectedClientNames: [],
        radiograms: {},
        operationalSections: {},
        patientCategories: defaultPatientCategories,
        vehicleTemplates: defaultVehicleTemplatesById,
        materialTemplates: defaultMaterialTemplatesById,
        personnelTemplates: defaultPersonnelTemplatesById,
        measureTemplates: defaultMeasureTemplateCategories,
        mapImageTemplates: defaultMapImagesTemplatesById,
        scoutables: {},
        userGeneratedContents: {},
        eocLog: [],
        participantKey,
        spatialTrees: {
            materials: SpatialTree.newSpatialTree(),
            patients: SpatialTree.newSpatialTree(),
            personnel: SpatialTree.newSpatialTree(),
        },
        configuration: newExerciseConfiguration(),
        patientCounter: 0,
        logEntries: undefined,
        lastLogEntry: undefined,
        previousTreatmentAssignment: undefined,
        currentStateVersion,
    };
}
