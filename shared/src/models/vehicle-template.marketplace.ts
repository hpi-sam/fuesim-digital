import type { Immutable, WritableDraft } from 'immer';
import type { UUID } from '../utils/uuid.js';
import { uuid } from '../utils/uuid.js';
import { createVehicleParameters } from '../state-helpers/create-vehicle-parameters.js';
import { ReducerError } from '../store/reducer-error.js';
import { cloneDeepMutable } from '../utils/clone-deep.js';
import { getElement } from '../store/action-reducers/utils/get-element.js';
import { hasEntityProperties } from '../marketplace/models/versioned-element-content.js';
import type { ExerciseState } from '../state.js';
import type {
    ChangeImpact,
    EditableElementChangeImpact,
    RemovedElementChangeImpact,
} from '../marketplace/exercise-collection-upgrade/exercise-collection-change-impact.js';
import { newChangeMapTarget } from '../marketplace/exercise-collection-upgrade/exercise-collection-change-target.js';
import type { ChangeApply } from '../marketplace/exercise-collection-upgrade/exercise-collection-change-apply.js';
import {
    checkEditableValueEdited,
    getEditableValueCheckers,
} from './utils/editable-values-registry.js';
import { registerMarketplaceElement } from './utils/marketplace-registry.js';
import { getTemplates } from './template-helpers.js';
import { changePosition } from './utils/position/position-helpers-mutable.js';
import { newVehiclePositionIn } from './utils/position/vehicle-position.js';
import { newMapCoordinatesAt } from './utils/position/map-coordinates.js';
import type { VehicleTemplate } from './vehicle-template.js';

function findIdArrayDifferences<T extends string>(
    oldArray: Immutable<T[]>,
    newArray: Immutable<T[]>
) {
    const oldElements = oldArray.reduce<{ [K in Immutable<T>]?: number }>(
        (acc, id) => {
            acc[id] = (acc[id] ?? 0) + 1;
            return acc;
        },
        {}
    );

    for (const id of newArray) {
        // Is still in old elements, which means it is not removed
        // remaining oldElements were removed in newElements
        if (oldElements[id]) {
            oldElements[id] -= 1;
            if (oldElements[id] === 0) {
                delete oldElements[id];
            }
        }
        // it is not present in the old elements, which means it is added
        else {
            oldElements[id] = -1;
        }
    }

    return {
        count: oldElements,
    };
}

function updateVehicleOnMap(
    draftState: WritableDraft<ExerciseState>,
    elementId: UUID,
    replacement: Immutable<VehicleTemplate>
) {
    const oldVehicle = getElement(draftState, 'vehicle', elementId);

    findIdArrayDifferences(
        Object.keys(oldVehicle.materialIds)
            .map((id) => draftState.materials[id]?.templateId)
            .filter((id): id is string => !!id),
        replacement.materialTemplateIds
    );

    // Remove UNUSED Material / Personnel
    for (const materialId of Object.keys(oldVehicle.materialIds)) {
        delete draftState.materials[materialId];
    }

    for (const personnelId of Object.keys(oldVehicle.personnelIds)) {
        delete draftState.personnel[personnelId];
    }

    // Create new Element
    const materialTemplates = Object.fromEntries(
        Object.entries(getTemplates(draftState, 'materialTemplate')).filter(
            ([_, f]) => replacement.materialTemplateIds.includes(f.id)
        )
    );

    const personnelTemplates = Object.fromEntries(
        Object.entries(getTemplates(draftState, 'personnelTemplate')).filter(
            ([_, f]) => replacement.personnelTemplateIds.includes(f.id)
        )
    );

    const newElement = cloneDeepMutable(
        createVehicleParameters(
            replacement.id,
            replacement,
            materialTemplates,
            personnelTemplates,
            newMapCoordinatesAt(0, 0),
            replacement.entity,
            true
        )
    );

    newElement.vehicle.id = elementId;
    newElement.vehicle.position = oldVehicle.position;

    // Add new Element to the state

    draftState.vehicles[elementId] = cloneDeepMutable(newElement.vehicle);

    for (const material of cloneDeepMutable(newElement.materials)) {
        changePosition(
            material,
            newVehiclePositionIn(newElement.vehicle.id),
            draftState
        );
        draftState.materials[material.id] = material;
    }
    for (const person of cloneDeepMutable(newElement.personnel)) {
        changePosition(
            person,
            newVehiclePositionIn(newElement.vehicle.id),
            draftState
        );
        draftState.personnel[person.id] = person;
    }
}

function updateVehicleKeepData(
    draftState: WritableDraft<ExerciseState>,
    elementId: UUID,
    changeApply: Immutable<ChangeApply>
) {
    const oldVehicle = cloneDeepMutable(
        getElement(draftState, 'vehicle', elementId)
    );
    const vehicleTemplate = Object.values(
        getTemplates(draftState, 'vehicleTemplate')
    ).find(
        (t) => t.entity?.entityId === changeApply.marketplaceElement.entityId
    );
    if (!vehicleTemplate) {
        throw new ReducerError(
            `No vehicle template found for element with id ${elementId}`
        );
    }
    let updatedVehicle = cloneDeepMutable(oldVehicle);

    for (const checker of getEditableValueCheckers(
        'vehicle',
        'vehicleTemplate'
    )) {
        updatedVehicle = checker.keep({
            template: vehicleTemplate,
            oldElement: oldVehicle,
            newElement: updatedVehicle,
        });
    }
    draftState.vehicles[oldVehicle.id] = updatedVehicle;
}

registerMarketplaceElement('vehicleTemplate', {
    changeApply: (state, changeApply) => {
        if (
            !(
                changeApply.target.kind === 'map' &&
                changeApply.target.elementType === 'vehicle'
            )
        )
            return;

        if (changeApply.type === 'removed') {
            switch (changeApply.action) {
                case 'remove': {
                    delete state.vehicles[changeApply.target.elementId];
                    break;
                }
                case 'replace': {
                    const replacement = changeApply.replaceWith;
                    if (replacement.type !== 'vehicleTemplate') {
                        throw new ReducerError(
                            `Replacement for vehicle template must be of type vehicle template, but got ${replacement.type}`
                        );
                    }
                    updateVehicleOnMap(
                        state,
                        changeApply.target.elementId,
                        replacement
                    );
                    break;
                }
            }
        } else if (changeApply.type === 'editable') {
            switch (changeApply.action) {
                case 'keep': {
                    updateVehicleKeepData(
                        state,
                        changeApply.target.elementId,
                        changeApply
                    );
                    break;
                }
                case 'update': {
                    const replacement = getTemplates(state, 'vehicleTemplate')[
                        changeApply.marketplaceElement.versionId
                    ];
                    if (!replacement) {
                        throw new ReducerError(
                            `No replacement template found for vehicle template with version id ${changeApply.marketplaceElement.versionId}`
                        );
                    }
                    updateVehicleOnMap(
                        state,
                        changeApply.target.elementId,
                        replacement
                    );
                    break;
                }
            }
        }
    },

    changeImpact: (state, change) => {
        const impacts: ChangeImpact[] = [];

        const vehiclesOnMap = Object.values(state.vehicles);

        if (change.type === 'update') {
            const affectedVehicles = vehiclesOnMap
                .filter(hasEntityProperties)
                .filter(
                    (vehicle) =>
                        vehicle.entity!.versionId === change.old.versionId
                );

            for (const affectedVehicle of affectedVehicles) {
                const editedValues = checkEditableValueEdited({
                    template: change.old.content,
                    element: cloneDeepMutable(affectedVehicle),
                });

                if (editedValues.length === 0) {
                    impacts.push(
                        ...affectedVehicles.map(
                            (vehicle) =>
                                ({
                                    id: uuid(),
                                    type: 'updated',
                                    entity: change.new,
                                    editedValue: undefined,
                                    element: affectedVehicle,
                                    target: newChangeMapTarget(
                                        'vehicle',
                                        affectedVehicle.id
                                    ),
                                }) satisfies EditableElementChangeImpact
                        )
                    );
                } else {
                    for (const editedValue of editedValues) {
                        impacts.push(
                            ...affectedVehicles.map(
                                (vehicle) =>
                                    ({
                                        id: uuid(),
                                        type: 'updated',
                                        entity: change.new,
                                        editedValue,
                                        element: affectedVehicle,
                                        target: newChangeMapTarget(
                                            'vehicle',
                                            affectedVehicle.id
                                        ),
                                    }) satisfies EditableElementChangeImpact
                            )
                        );
                    }
                }
            }
        }
        if (change.type === 'remove') {
            // Check on Map
            const affectedVehicles = vehiclesOnMap
                .filter(hasEntityProperties)
                .filter(
                    (vehicle) =>
                        vehicle.entity!.versionId === change.old.versionId
                );

            for (const affectedVehicle of affectedVehicles) {
                impacts.push({
                    id: uuid(),
                    entity: change.old,
                    element: affectedVehicle,
                    target: newChangeMapTarget('vehicle', affectedVehicle.id),
                    type: 'removed',
                } satisfies RemovedElementChangeImpact);
            }
        }

        return impacts;
    },
});
