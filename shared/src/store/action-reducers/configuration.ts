import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';
import { TileMapProperties } from '../../models/utils/index.js';
import { cloneDeepMutable } from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';

export class SetTileMapPropertiesAction implements Action {
    @IsValue('[Configuration] Set tileMapProperties' as const)
    public readonly type = '[Configuration] Set tileMapProperties';

    @ValidateNested()
    @Type(() => TileMapProperties)
    public readonly tileMapProperties!: TileMapProperties;
}

export class SetPretriageEnabledAction implements Action {
    @IsValue('[Configuration] Set pretriageEnabled' as const)
    public readonly type = '[Configuration] Set pretriageEnabled';

    @IsBoolean()
    public readonly pretriageEnabled!: boolean;
}

export class SetBluePatientsEnabledFlagAction implements Action {
    @IsValue('[Configuration] Set bluePatientsEnabled' as const)
    public readonly type = '[Configuration] Set bluePatientsEnabled';

    @IsBoolean()
    public readonly bluePatientsEnabled!: boolean;
}

export class SetPatientIdentifierPrefixAction implements Action {
    @IsValue('[Configuration] Set patientIdentifierPrefix' as const)
    public readonly type = '[Configuration] Set patientIdentifierPrefix';

    @IsString()
    public readonly patientIdentifierPrefix!: string;
}

export class SetVehicleStatusHighlightEnabled implements Action {
    @IsValue('[Configuration] Set vehicleStatusHighlightEnabled' as const)
    public readonly type = '[Configuration] Set vehicleStatusHighlightEnabled';

    @IsBoolean()
    public readonly vehicleStatusHighlightEnabled!: boolean;
}

export class SetVehicleStatusInSkColorEnabled implements Action {
    @IsValue('[Configuration] Set SetVehicleStatusInSkColorEnabled' as const)
    public readonly type =
        '[Configuration] Set SetVehicleStatusInSkColorEnabled';

    @IsBoolean()
    public readonly vehicleStatusInSkColorEnabled!: boolean;
}

export namespace ConfigurationActionReducers {
    export const setTileMapProperties: ActionReducer<SetTileMapPropertiesAction> =
        {
            action: SetTileMapPropertiesAction,
            reducer: (draftState, { tileMapProperties }) => {
                draftState.configuration.tileMapProperties =
                    cloneDeepMutable(tileMapProperties);
                return draftState;
            },
            rights: 'trainer',
        };

    export const setPretriageFlag: ActionReducer<SetPretriageEnabledAction> = {
        action: SetPretriageEnabledAction,
        reducer: (draftState, { pretriageEnabled }) => {
            draftState.configuration.pretriageEnabled = pretriageEnabled;
            return draftState;
        },
        rights: 'trainer',
    };

    export const setBluePatientsFlag: ActionReducer<SetBluePatientsEnabledFlagAction> =
        {
            action: SetBluePatientsEnabledFlagAction,
            reducer: (draftState, { bluePatientsEnabled }) => {
                draftState.configuration.bluePatientsEnabled =
                    bluePatientsEnabled;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setPatientIdentifierPrefix: ActionReducer<SetPatientIdentifierPrefixAction> =
        {
            action: SetPatientIdentifierPrefixAction,
            reducer(draftState, { patientIdentifierPrefix }) {
                draftState.configuration.patientIdentifierPrefix =
                    patientIdentifierPrefix;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setVehicleStatusHighlight: ActionReducer<SetVehicleStatusHighlightEnabled> =
        {
            action: SetVehicleStatusHighlightEnabled,
            reducer(draftState, { vehicleStatusHighlightEnabled }) {
                draftState.configuration.vehicleStatusHighlight =
                    vehicleStatusHighlightEnabled;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setVehicleStatusInSkColor: ActionReducer<SetVehicleStatusInSkColorEnabled> =
        {
            action: SetVehicleStatusInSkColorEnabled,
            reducer(draftState, { vehicleStatusInSkColorEnabled }) {
                draftState.configuration.vehicleStatusInSkColor =
                    vehicleStatusInSkColorEnabled;
                return draftState;
            },
            rights: 'trainer',
        };
}
