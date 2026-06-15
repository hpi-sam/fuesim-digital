import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import {
    tileMapPropertiesSchema,
    operationsMapPropertiesSchema,
} from '../../models/utils/map-properties.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import {
    ExerciseConfiguration,
    exerciseConfigurationSchema,
} from '../../models/exercise-configuration.js';

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
    pretriageEnabled: z.boolean(),
});
export type SetPretriageEnabledAction = Immutable<
    z.infer<typeof setPretriageEnabledActionSchema>
>;

export const setBluePatientsEnabledFlagActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set bluePatientsEnabled'),
    bluePatientsEnabled: z.boolean(),
});
export type SetBluePatientsEnabledFlagAction = Immutable<
    z.infer<typeof setBluePatientsEnabledFlagActionSchema>
>;

export const setPatientIdentifierPrefixActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set patientIdentifierPrefix'),
    patientIdentifierPrefix: z.string(),
});
export type SetPatientIdentifierPrefixAction = Immutable<
    z.infer<typeof setPatientIdentifierPrefixActionSchema>
>;

export const setVehicleStatusHighlightEnabledActionSchema = z.strictObject({
    type: z.literal('[Configuration] Set vehicleStatusHighlightEnabled'),
    vehicleStatusHighlightEnabled: z.boolean(),
});
export type SetVehicleStatusHighlightEnabled = Immutable<
    z.infer<typeof setVehicleStatusHighlightEnabledActionSchema>
>;

export const setVehicleStatusInPatientStatusColorEnabledSchema = z.strictObject(
    {
        type: z.literal(
            '[Configuration] Set vehicleStatusInPatientStatusColorEnabled'
        ),
        vehicleStatusInPatientStatusColor: z.boolean(),
    }
);
export type SetVehicleStatusInPatientStatusColorEnabled = Immutable<
    z.infer<typeof setVehicleStatusInPatientStatusColorEnabledSchema>
>;

export class SetHighlightRelatedElements implements Action {
    @IsValue('[Configuration] Set highlightRelatedElements' as const)
    public readonly type = '[Configuration] Set highlightRelatedElements';

    @IsZodSchema(exerciseConfigurationSchema.shape.highlightRelatedElements)
    public readonly highlightRelatedElements!: ExerciseConfiguration['highlightRelatedElements'];
}

export class SetParticipantLoadAllEnabled implements Action {
    @IsValue('[Configuration] Set participantLoadAllEnabled' as const)
    public readonly type = '[Configuration] Set participantLoadAllEnabled';

    @IsBoolean()
    public readonly participantLoadAllEnabled!: boolean;
}

export namespace ConfigurationActionReducers {
    export const setTileMapProperties: ActionReducer<SetTileMapPropertiesAction> =
        {
            type: '[Configuration] Set tileMapProperties',
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
            type: '[Configuration] Set operationsMapProperties',
            actionSchema: setOperationsMapPropertiesActionSchema,
            reducer: (draftState, { operationsMapProperties }) => {
                draftState.configuration.operationsMapProperties =
                    operationsMapProperties;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setPretriageFlag: ActionReducer<SetPretriageEnabledAction> = {
        type: '[Configuration] Set pretriageEnabled',
        actionSchema: setPretriageEnabledActionSchema,
        reducer: (draftState, { pretriageEnabled }) => {
            draftState.configuration.pretriageEnabled = pretriageEnabled;
            return draftState;
        },
        rights: 'trainer',
    };

    export const setBluePatientsFlag: ActionReducer<SetBluePatientsEnabledFlagAction> =
        {
            type: '[Configuration] Set bluePatientsEnabled',
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
            type: '[Configuration] Set patientIdentifierPrefix',
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
            type: '[Configuration] Set vehicleStatusHighlightEnabled',
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
            type: '[Configuration] Set vehicleStatusInPatientStatusColorEnabled',
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
            action: SetHighlightRelatedElements,
            reducer(draftState, { highlightRelatedElements }) {
                draftState.configuration.highlightRelatedElements =
                    highlightRelatedElements;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setParticipantLoadAllEnabled: ActionReducer<SetParticipantLoadAllEnabled> =
        {
            action: SetParticipantLoadAllEnabled,
            reducer(draftState, { participantLoadAllEnabled }) {
                draftState.configuration.participantLoadAllEnabled =
                    participantLoadAllEnabled;
                return draftState;
            },
            rights: 'trainer',
        };
}
