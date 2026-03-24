import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { z } from 'zod';
import { uuidValidationOptions } from '../../utils/uuid.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { Action, ActionReducer } from '../action-reducer.js';
import {
    localOperationsCommandAssignmentSchema,
    operationalSectionAssignmentSchema,
    operationalSectionSchema,
} from '../../models/operational-section.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { ReducerError } from '../reducer-error.js';

export class AddOperationalSectionAction implements Action {
    @IsValue('[OperationalSection] Add Operational Section')
    public readonly type = '[OperationalSection] Add Operational Section';

    @IsUUID(4, uuidValidationOptions)
    public readonly sectionId!: string;

    @IsString()
    public readonly title!: string;
}

export class RenameOperationalSectionAction implements Action {
    @IsValue('[OperationalSection] Rename Operational Section')
    public readonly type = '[OperationalSection] Rename Operational Section';

    @IsUUID(4, uuidValidationOptions)
    public readonly sectionId!: string;

    @IsString()
    public readonly newTitle!: string;
}

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

    @IsZodSchema(z.number().optional())
    public readonly position!: number | undefined;
}

export class AssignLocalOperationsCommandAction implements Action {
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
                if (draftState.operationalSections[sectionId]) {
                    return draftState;
                }

                const newSection = operationalSectionSchema.parse({
                    type: 'operationalSection',
                    id: sectionId,
                    title,
                });

                draftState.operationalSections[sectionId] = newSection;

                return draftState;
            },
            rights: 'operationsTablet',
        };

    export const renameOperationalSection: ActionReducer<RenameOperationalSectionAction> =
        {
            action: RenameOperationalSectionAction,
            reducer: (draftState, { sectionId, newTitle }) => {
                const section = draftState.operationalSections[sectionId];
                if (!section) {
                    return draftState;
                }

                section.title = newTitle;

                return draftState;
            },
            rights: 'operationsTablet',
        };

    export const removeOperationalSection: ActionReducer<RemoveOperationalSectionAction> =
        {
            action: RemoveOperationalSectionAction,
            reducer: (draftState, { sectionId }) => {
                Object.keys(draftState.vehicles).forEach((vehicleId) => {
                    const vehicle = draftState.vehicles[vehicleId];
                    if (!vehicle) return;

                    if (
                        vehicle.operationalAssignment?.type ===
                            'operationalSection' &&
                        vehicle.operationalAssignment.sectionId === sectionId
                    ) {
                        draftState.vehicles[vehicleId]!.operationalAssignment =
                            null;
                    }
                });

                delete draftState.operationalSections[sectionId];

                return draftState;
            },
            rights: 'operationsTablet',
        };

    export const moveVehicleToOperationalSection: ActionReducer<MoveVehicleToOperationalSectionAction> =
        {
            action: MoveVehicleToOperationalSectionAction,
            reducer: (
                draftState,
                { sectionId, vehicleId, assignAsSectionLeader, position }
            ) => {
                if (sectionId) {
                    const section = draftState.operationalSections[sectionId];
                    if (!section) {
                        return draftState;
                    }
                }

                const vehicle = draftState.vehicles[vehicleId];
                if (!vehicle) {
                    return draftState;
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

                const previousAssignment = vehicle.operationalAssignment;

                if (
                    previousAssignment?.type === 'operationalSection' &&
                    previousAssignment.role === 'operationalSectionMember'
                ) {
                    // Update position of all vehicles in the previous section that have to be moved
                    Object.values(draftState.vehicles).forEach((v) => {
                        if (
                            v.operationalAssignment?.type ===
                                'operationalSection' &&
                            v.operationalAssignment.role ===
                                'operationalSectionMember' &&
                            v.operationalAssignment.sectionId ===
                                previousAssignment.sectionId &&
                            v.operationalAssignment.position >
                                previousAssignment.position
                        ) {
                            v.operationalAssignment.position -= 1;
                        }
                    });
                }

                if (sectionId === null) {
                    vehicle.operationalAssignment = null;
                    return draftState;
                }

                if (assignAsSectionLeader) {
                    vehicle.operationalAssignment =
                        operationalSectionAssignmentSchema.parse({
                            type: 'operationalSection',
                            role: 'operationalSectionLeader',
                            sectionId,
                        });
                    return draftState;
                }

                if (position === undefined)
                    throw new ReducerError(
                        'position cannot be undefined if assignAsSectionLeader is false'
                    );

                vehicle.operationalAssignment =
                    operationalSectionAssignmentSchema.parse({
                        type: 'operationalSection',
                        role: 'operationalSectionMember',
                        sectionId,
                        position,
                    });

                // Update position of all vehicles in this section that have to be moved
                Object.values(draftState.vehicles).forEach((v) => {
                    if (
                        v.operationalAssignment?.type ===
                            'operationalSection' &&
                        v.operationalAssignment.role ===
                            'operationalSectionMember' &&
                        v.operationalAssignment.sectionId === sectionId &&
                        v.operationalAssignment.position >= position &&
                        v.id !== vehicleId
                    ) {
                        v.operationalAssignment.position += 1;
                    }
                });

                return draftState;
            },
            rights: 'operationsTablet',
        };

    export const assignLocalOperationsCommand: ActionReducer<AssignLocalOperationsCommandAction> =
        {
            action: AssignLocalOperationsCommandAction,
            reducer: (draftState, { vehicleId }) => {
                const vehicle = draftState.vehicles[vehicleId];

                if (!vehicle) {
                    return draftState;
                }

                const localOperationsCommandAssigned = Object.values(
                    draftState.vehicles
                ).some(
                    (v) =>
                        v.operationalAssignment?.type ===
                        'localOperationsCommand'
                );
                if (localOperationsCommandAssigned) {
                    return draftState;
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
