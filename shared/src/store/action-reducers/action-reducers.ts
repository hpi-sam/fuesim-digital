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
    ...TechnicalChallengeActionReducers,
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
const exerciseActionTypeDictionary: ExerciseActionTypeDictionary =
    Object.values(actionReducers)
        .map((actionReducer) => {
            if ('type' in actionReducer) {
                return {
                    type: actionReducer.type,
                    reducer: actionReducer,
                } as const;
            }
            return {
                // the generated ts code from class default values adds them only in the constructor: https://github.com/microsoft/TypeScript/issues/15607
                // therefore we have to call the constructor (An ActionClass constructor is therefore required to not throw an error when called without arguments)
                type: new actionReducer.action().type,
                reducer: actionReducer,
            } as const;
        })
        .reduce(function (accumulator, value) {
            // TODO: Dig into this error and look at plausible workarounds
            // @ts-expect-error Results in TS2590; too complex union type ¯\_(ツ)_/¯
            accumulator[value.type as keyof ExerciseActionTypeDictionary] =
                value.reducer;
            return accumulator;
        }, {} as ExerciseActionTypeDictionary);

export function isActionType(
    actionType: string
): actionType is ExerciseAction['type'] {
    return actionType in exerciseActionTypeDictionary;
}

export function lookupReducerFor(
    actionType: ExerciseAction['type']
): ActionReducer<ExerciseAction> {
    // TODO: This is a fishy cast
    return exerciseActionTypeDictionary[
        actionType
    ] as ActionReducer<ExerciseAction>;
}

/**
 * A Union of all actions of the exercise.
 */
export type ExerciseAction = ExtractAction<ExerciseActionReducer>;
