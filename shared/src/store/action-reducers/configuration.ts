import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import {
    tileMapPropertiesSchema,
    operationsMapPropertiesSchema,
} from '../../models/utils/map-properties.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { exerciseConfigurationSchema } from '../../models/exercise-configuration.js';

export const setTileMapPropertiesActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set tileMapProperties'),
    tileMapProperties: tileMapPropertiesSchema,
});
export type SetTileMapPropertiesAction = Immutable<
    z.infer<typeof setTileMapPropertiesActionSchema>
>;

export const setOperationsMapPropertiesActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set operationsMapProperties'),
    operationsMapProperties: operationsMapPropertiesSchema,
});
export type SetOperationsMapPropertiesAction = Immutable<
    z.infer<typeof setOperationsMapPropertiesActionSchema>
>;

export const setPretriageEnabledActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set pretriageEnabled'),
    pretriageEnabled: exerciseConfigurationSchema.shape.pretriageEnabled,
});
export type SetPretriageEnabledAction = Immutable<
    z.infer<typeof setPretriageEnabledActionSchema>
>;

export const setBluePatientsEnabledFlagActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set bluePatientsEnabled'),
    bluePatientsEnabled: exerciseConfigurationSchema.shape.bluePatientsEnabled,
});
export type SetBluePatientsEnabledFlagAction = Immutable<
    z.infer<typeof setBluePatientsEnabledFlagActionSchema>
>;

export const setPatientIdentifierPrefixActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set patientIdentifierPrefix'),
    patientIdentifierPrefix:
        exerciseConfigurationSchema.shape.patientIdentifierPrefix,
});
export type SetPatientIdentifierPrefixAction = Immutable<
    z.infer<typeof setPatientIdentifierPrefixActionSchema>
>;

export const setVehicleStatusHighlightEnabledActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set vehicleStatusHighlightEnabled'),
    vehicleStatusHighlightEnabled:
        exerciseConfigurationSchema.shape.vehicleStatusHighlight,
});
export type SetVehicleStatusHighlightEnabled = Immutable<
    z.infer<typeof setVehicleStatusHighlightEnabledActionSchema>
>;

export const setVehicleStatusInPatientStatusColorEnabledSchema = z.strictObject(
    {
        type: z.literal(
            '[Configuration] Set vehicleStatusInPatientStatusColorEnabled'
        ),
        vehicleStatusInPatientStatusColor:
            exerciseConfigurationSchema.shape.vehicleStatusInPatientStatusColor,
    }
);
export type SetVehicleStatusInPatientStatusColorEnabled = Immutable<
    z.infer<typeof setVehicleStatusInPatientStatusColorEnabledSchema>
>;

export const setHighlightRelatedElementsActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set highlightRelatedElements'),
    highlightRelatedElements:
        exerciseConfigurationSchema.shape.highlightRelatedElements,
});
export type SetHighlightRelatedElements = Immutable<
    z.infer<typeof setHighlightRelatedElementsActionSchema>
>;

export const setParticipantLoadAllEnabledActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set participantLoadAllEnabled'),
    participantLoadAllEnabled:
        exerciseConfigurationSchema.shape.participantLoadAllEnabled,
});
export type SetParticipantLoadAllEnabled = Immutable<
    z.infer<typeof setParticipantLoadAllEnabledActionSchema>
>;

export namespace ConfigurationActionReducers {
    export const setTileMapProperties: ActionReducer<SetTileMapPropertiesAction> =
        {
            type: setTileMapPropertiesActionSchema.shape.type.value,
            actionSchema: setTileMapPropertiesActionSchema,
            reducer: (draftState, { tileMapProperties }) => {
                draftState.configuration.tileMapProperties =
                    cloneDeepMutable(tileMapProperties);
                return draftState;
            },
            rights: 'trainer',
        };

    export const setOperationsMapProperties: ActionReducer<SetOperationsMapPropertiesAction> =
        {
            type: setOperationsMapPropertiesActionSchema.shape.type.value,
            actionSchema: setOperationsMapPropertiesActionSchema,
            reducer: (draftState, { operationsMapProperties }) => {
                draftState.configuration.operationsMapProperties =
                    operationsMapProperties;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setPretriageFlag: ActionReducer<SetPretriageEnabledAction> = {
        type: setPretriageEnabledActionSchema.shape.type.value,
        actionSchema: setPretriageEnabledActionSchema,
        reducer: (draftState, { pretriageEnabled }) => {
            draftState.configuration.pretriageEnabled = pretriageEnabled;
            return draftState;
        },
        rights: 'trainer',
    };

    export const setBluePatientsFlag: ActionReducer<SetBluePatientsEnabledFlagAction> =
        {
            type: setBluePatientsEnabledFlagActionSchema.shape.type.value,
            actionSchema: setBluePatientsEnabledFlagActionSchema,
            reducer: (draftState, { bluePatientsEnabled }) => {
                draftState.configuration.bluePatientsEnabled =
                    bluePatientsEnabled;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setPatientIdentifierPrefix: ActionReducer<SetPatientIdentifierPrefixAction> =
        {
            type: setPatientIdentifierPrefixActionSchema.shape.type.value,
            actionSchema: setPatientIdentifierPrefixActionSchema,
            reducer(draftState, { patientIdentifierPrefix }) {
                draftState.configuration.patientIdentifierPrefix =
                    patientIdentifierPrefix;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setVehicleStatusHighlight: ActionReducer<SetVehicleStatusHighlightEnabled> =
        {
            type: setVehicleStatusHighlightEnabledActionSchema.shape.type.value,
            actionSchema: setVehicleStatusHighlightEnabledActionSchema,
            reducer(draftState, { vehicleStatusHighlightEnabled }) {
                draftState.configuration.vehicleStatusHighlight =
                    vehicleStatusHighlightEnabled;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setVehicleStatusInSkColor: ActionReducer<SetVehicleStatusInPatientStatusColorEnabled> =
        {
            type: setVehicleStatusInPatientStatusColorEnabledSchema.shape.type
                .value,
            actionSchema: setVehicleStatusInPatientStatusColorEnabledSchema,
            reducer(draftState, { vehicleStatusInPatientStatusColor }) {
                draftState.configuration.vehicleStatusInPatientStatusColor =
                    vehicleStatusInPatientStatusColor;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setHighlightRelatedElements: ActionReducer<SetHighlightRelatedElements> =
        {
            type: setHighlightRelatedElementsActionSchema.shape.type.value,
            actionSchema: setHighlightRelatedElementsActionSchema,
            reducer(draftState, { highlightRelatedElements }) {
                draftState.configuration.highlightRelatedElements =
                    highlightRelatedElements;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setParticipantLoadAllEnabled: ActionReducer<SetParticipantLoadAllEnabled> =
        {
            type: setParticipantLoadAllEnabledActionSchema.shape.type.value,
            actionSchema: setParticipantLoadAllEnabledActionSchema,
            reducer(draftState, { participantLoadAllEnabled }) {
                draftState.configuration.participantLoadAllEnabled =
                    participantLoadAllEnabled;
                return draftState;
            },
            rights: 'trainer',
        };
}
