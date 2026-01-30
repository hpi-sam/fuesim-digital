import { IsOptional, IsString, IsUUID } from 'class-validator';
import { uuidValidationOptions } from '../../utils/uuid.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';
import { operationalSectionSchema } from '../../models/operational-section.js';

export class AddOperationalSectionAction implements Action {
    @IsValue('[OperationalSection] Add Operational Section')
    public readonly type = '[OperationalSection] Add Operational Section';

    @IsUUID(4, uuidValidationOptions)
    public readonly sectionId!: string;

    @IsString()
    public readonly title!: string;
}

//TODO: @Quixelation Implement the reducer logic
export class RemoveOperationalSectionAction implements Action {
    @IsValue('[OperationalSection] Remove Operational Section')
    public readonly type = '[OperationalSection] Remove Operational Section';

    @IsUUID(4, uuidValidationOptions)
    public readonly sectionId!: string;
}

export class MoveVehicleToOperationalSectionAction implements Action {
    @IsValue('[OperationalSection] Move Vehicle To Operational Section')
    public readonly type =
        '[OperationalSection] Move Vehicle To Operational Section';

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    public readonly sectionId!: string | null;

    @IsUUID(4, uuidValidationOptions)
    public readonly vehicleId!: string;
}

export namespace OperationalSectionActionReducers {
    export const addOperationalSection: ActionReducer<AddOperationalSectionAction> =
        {
            action: AddOperationalSectionAction,
            reducer: (draftState, { sectionId, title }) => {
                const newSection = operationalSectionSchema.parse({
                    type: 'operationalSection',
                    id: sectionId,
                    title: title,
                });

                if (draftState.operationalSections[sectionId]) {
                    throw new Error(
                        `Operational Section with id ${sectionId} already exists.`
                    );
                }

                draftState.operationalSections[sectionId] = newSection;

                return draftState;
            },
            rights: 'operationsTablet',
        };

    export const moveVehicleToOperationalSection: ActionReducer<MoveVehicleToOperationalSectionAction> =
        {
            action: MoveVehicleToOperationalSectionAction,
            reducer: (draftState, { sectionId, vehicleId }) => {
                if (sectionId) {
                    const section = draftState.operationalSections[sectionId];
                    if (!section) {
                        throw new Error(
                            `Operational Section with id ${sectionId} does not exist.`
                        );
                    }
                }

                const vehicle = draftState.vehicles[vehicleId];
                if (!vehicle) {
                    throw new Error(
                        `Vehicle with id ${vehicleId} does not exist.`
                    );
                }

                vehicle.operationalSectionId = sectionId;

                return draftState;
            },
            rights: 'operationsTablet',
        };
}

function IsNull(): (
    target: MoveVehicleToOperationalSectionAction,
    propertyKey: 'sectionId'
) => void {
    throw new Error('Function not implemented.');
}
