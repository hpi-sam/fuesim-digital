import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { uuidValidationOptions } from '../../utils/uuid.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';
import {
    localOperationsCommandAssignmentSchema,
    operationalAssignmentSchema,
    operationalSectionAssignmentSchema,
    operationalSectionSchema,
} from '../../models/operational-section.js';

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

    @IsBoolean()
    public readonly assignAsSectionLeader!: boolean;
}

export class AssingLocalOperationsCommandAction implements Action {
    @IsValue('[OperationalSection] Assign Local Operations Command')
    public readonly type =
        '[OperationalSection] Assign Local Operations Command';

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
        reducer: (
            draftState,
            { sectionId, vehicleId, assignAsSectionLeader }
        ) => {
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

            if (assignAsSectionLeader) {
                const sectionHasLeader = Object.values(
                    draftState.vehicles
                ).some(
                    (v) =>
                        v.operationalAssignment?.type ===
                        'operationalSection' &&
                        v.operationalAssignment.role ===
                        'operationalSectionLeader' &&
                        v.operationalAssignment.sectionId === sectionId
                );
                if (sectionHasLeader) {
                    throw new Error(
                        `Operational Section with id ${sectionId} already has a leader assigned.`
                    );
                }
            }

            vehicle.operationalAssignment =
                sectionId == null
                    ? null
                    : operationalSectionAssignmentSchema.parse({
                        type: "operationalSection",
                        role: assignAsSectionLeader
                            ? 'operationalSectionLeader'
                            : 'operationalSectionMember',
                        sectionId: sectionId,
                    });

            return draftState;
        },
        rights: 'operationsTablet',
    };

    export const assignLocalOperationsCommand: ActionReducer<AssingLocalOperationsCommandAction> =
    {
        action: AssingLocalOperationsCommandAction,
        reducer: (draftState, { vehicleId }) => {
            const vehicle = draftState.vehicles[vehicleId];

            if (!vehicle) {
                throw new Error(
                    `Vehicle with id ${vehicleId} does not exist.`
                );
            }

            const localOperationsCommandAssigned = Object.values(
                draftState.vehicles
            ).some(
                (v) =>
                    v.operationalAssignment?.type ===
                    'localOperationsCommand'
            );
            if (localOperationsCommandAssigned) {
                throw new Error(
                    'Local Operations Command is already assigned to another vehicle.'
                );
            }

            vehicle.operationalAssignment =
                localOperationsCommandAssignmentSchema.parse({
                    type: 'localOperationsCommand',
                });

            return draftState;
        },
        rights: 'operationsTablet',
    };
}
