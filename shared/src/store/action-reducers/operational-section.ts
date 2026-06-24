import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import {
    localOperationsCommandAssignmentSchema,
    operationalSectionAssignmentSchema,
    operationalSectionSchema,
    operationalSectionMemberAssignmentSchema,
} from '../../models/operational-section.js';
import { ReducerError } from '../reducer-error.js';
import { vehicleSchema } from '../../models/vehicle.js';
import {
    fillPositionAt,
    freePositionAt,
} from './utils/operational-assignment-positions.js';

const addOperationalSectionActionSchema = z.strictObject({
    type: z.literal('[OperationalSection] Add Operational Section'),
    sectionId: operationalSectionSchema.shape.id,
    title: operationalSectionSchema.shape.title,
});
export type AddOperationalSectionAction = Immutable<
    z.infer<typeof addOperationalSectionActionSchema>
>;

const renameOperationalSectionActionSchema = z.strictObject({
    type: z.literal('[OperationalSection] Rename Operational Section'),
    sectionId: operationalSectionSchema.shape.id,
    newTitle: operationalSectionSchema.shape.title,
});
export type RenameOperationalSectionAction = Immutable<
    z.infer<typeof renameOperationalSectionActionSchema>
>;

const removeOperationalSectionActionSchema = z.strictObject({
    type: z.literal('[OperationalSection] Remove Operational Section'),
    sectionId: operationalSectionSchema.shape.id,
});
export type RemoveOperationalSectionAction = Immutable<
    z.infer<typeof removeOperationalSectionActionSchema>
>;

const moveVehicleToOperationalSectionActionSchema = z.strictObject({
    type: z.literal('[OperationalSection] Move Vehicle To Operational Section'),
    sectionId: operationalSectionSchema.shape.id.nullable(),
    vehicleId: vehicleSchema.shape.id,
    assignAsSectionLeader: z.boolean(),
    position:
        operationalSectionMemberAssignmentSchema.shape.position.optional(),
});
export type MoveVehicleToOperationalSectionAction = Immutable<
    z.infer<typeof moveVehicleToOperationalSectionActionSchema>
>;

const assignLocalOperationsCommandActionSchema = z.strictObject({
    type: z.literal('[OperationalSection] Assign Local Operations Command'),
    vehicleId: vehicleSchema.shape.id,
});
export type AssignLocalOperationsCommandAction = Immutable<
    z.infer<typeof assignLocalOperationsCommandActionSchema>
>;

export namespace OperationalSectionActionReducers {
    export const addOperationalSection: ActionReducer<AddOperationalSectionAction> =
        {
            type: addOperationalSectionActionSchema.shape.type.value,
            actionSchema: addOperationalSectionActionSchema,
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
            type: renameOperationalSectionActionSchema.shape.type.value,
            actionSchema: renameOperationalSectionActionSchema,
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
            type: removeOperationalSectionActionSchema.shape.type.value,
            actionSchema: removeOperationalSectionActionSchema,
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
            type: moveVehicleToOperationalSectionActionSchema.shape.type.value,
            actionSchema: moveVehicleToOperationalSectionActionSchema,
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
                    fillPositionAt(
                        draftState,
                        previousAssignment.sectionId,
                        previousAssignment.position
                    );
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

                freePositionAt(draftState, sectionId, position);

                vehicle.operationalAssignment =
                    operationalSectionAssignmentSchema.parse({
                        type: 'operationalSection',
                        role: 'operationalSectionMember',
                        sectionId,
                        position,
                    });

                return draftState;
            },
            rights: 'operationsTablet',
        };

    export const assignLocalOperationsCommand: ActionReducer<AssignLocalOperationsCommandAction> =
        {
            type: assignLocalOperationsCommandActionSchema.shape.type.value,
            actionSchema: assignLocalOperationsCommandActionSchema,
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
