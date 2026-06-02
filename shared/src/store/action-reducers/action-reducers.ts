import type { ActionReducer } from '../action-reducer.js';
import { AlarmGroupActionReducers } from './alarm-group.js';
import { ClientActionReducers } from './client.js';
import { ExerciseActionReducers } from './exercise.js';
import { ConfigurationActionReducers } from './configuration.js';
import { HospitalActionReducers } from './hospital.js';
import { MapImageTemplatesActionReducers } from './map-image-template.js';
import { MapImagesActionReducers } from './map-image.js';
import { MaterialActionReducers } from './material.js';
import { PatientActionReducers } from './patient.js';
import { PersonnelActionReducers } from './personnel.js';
import { TransferActionReducers } from './transfer.js';
import { TransferPointActionReducers } from './transfer-point.js';
import { VehicleActionReducers } from './vehicle.js';
import { ViewportActionReducers } from './viewport.js';
import { EmergencyOperationCenterActionReducers } from './emergency-operation-center.js';
import { SimulatedRegionActionReducers } from './simulated-region.js';
import { SimulationActionReducers } from './simulation.js';
import { RadiogramActionReducers } from './radiogram.js';
import { VehicleTemplateActionReducers } from './vehicle-templates.js';
import { RestrictedZoneActionReducers } from './restricted-zone.js';
import { OperationalSectionActionReducers } from './operational-section.js';
import { ScoutableActionReducers } from './scoutable.js';
import { MeasureActionReducers } from './measure.js';
import { MeasureTemplateActionReducers } from './measure-templates.js';
import { MeasureTemplateActionReducers as MeasureTemplateCategoryActionReducers } from './measure-template-categories.js';
import { DrawingActionReducers } from './drawing.js';
import { TechnicalChallengeActionReducers } from './technical-challenge.js';
/**
 * All action reducers of the exercise must be registered here
 */
const actionReducers = {
    ...ClientActionReducers,
    ...ExerciseActionReducers,
    ...MaterialActionReducers,
    ...MapImagesActionReducers,
    ...PatientActionReducers,
    ...PersonnelActionReducers,
    ...VehicleActionReducers,
    ...ViewportActionReducers,
    ...TransferPointActionReducers,
    ...ConfigurationActionReducers,
    ...AlarmGroupActionReducers,
    ...MapImageTemplatesActionReducers,
    ...TransferActionReducers,
    ...HospitalActionReducers,
    ...EmergencyOperationCenterActionReducers,
    ...SimulatedRegionActionReducers,
    ...SimulationActionReducers,
    ...RadiogramActionReducers,
    ...VehicleTemplateActionReducers,
    ...RestrictedZoneActionReducers,
    ...OperationalSectionActionReducers,
    ...ScoutableActionReducers,
    ...TechnicalChallengeActionReducers,
    ...MeasureActionReducers,
    ...MeasureTemplateActionReducers,
    ...MeasureTemplateCategoryActionReducers,
    ...DrawingActionReducers,
} as const;

type ExerciseActionReducer =
    (typeof actionReducers)[keyof typeof actionReducers];

type ExtractAction<R> = R extends ActionReducer<infer A> ? A : never;

/**
 * A map that maps from each `Action.type` to the corresponding `ActionReducer`.
 */
type ExerciseActionTypeDictionary = {
    [_ActionReducer in ExerciseActionReducer as ExtractAction<_ActionReducer>['type']]: _ActionReducer;
};

/**
 * This dictionary maps the action type to the ActionReducer.
 */
export const exerciseActionTypeDictionary: ExerciseActionTypeDictionary =
    Object.fromEntries(
        Object.values(actionReducers).map(
            (actionReducer) => [actionReducer.type, actionReducer] as const
        )
    ) as ExerciseActionTypeDictionary;

export function isActionType(
    actionType: string
): actionType is ExerciseAction['type'] {
    return actionType in exerciseActionTypeDictionary;
}

export function lookupReducerFor(
    actionType: ExerciseAction['type']
): ActionReducer<ExerciseAction> {
    return exerciseActionTypeDictionary[
        actionType
    ] as ActionReducer<ExerciseAction>;
}

/**
 * A Union of all actions of the exercise.
 */
export type ExerciseAction = ExtractAction<ExerciseActionReducer>;
