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
import type { Material } from './material.js';
import type { Personnel } from './personnel.js';
import type { Vehicle } from './vehicle.js';

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
        }
        // it is not present in the old elements, which means it is added
        else {
            oldElements[id] = -1;
        }
    }

    return {
        /*
         * count < 0 means it is added in new array,
         * count = 0 means it is unchanged
         * count > 0 means it is removed in new array
         */
        count: oldElements,
    };
}

/**
 * Removed material & personnel which are not used anymore after the vehicle template change
 * on map
 */
function removeUnusedAccessories(
    draftState: WritableDraft<ExerciseState>,
    oldVehicle: Immutable<Vehicle>,
    replacement: Immutable<VehicleTemplate>
): VehicleTemplate {
    const mutableReplacement = cloneDeepMutable(replacement);

    // MATERIALS
    const materialDifference = findIdArrayDifferences(
        Object.keys(oldVehicle.materialIds)
            .map((id) => draftState.materials[id]?.templateId)
            .filter((id): id is string => !!id),
        replacement.materialTemplateIds
    );

    const addedMaterialTemplateIds = Object.entries(
        materialDifference.count
    ).filter(([_, count]) => (count ?? 0) < 0);

    mutableReplacement.materialTemplateIds = [];
    for (const [materialTemplateId, count] of addedMaterialTemplateIds) {
        for (let i = 0; i < Math.abs(count!); i++) {
            mutableReplacement.materialTemplateIds.push(materialTemplateId);
        }
    }

    const unusedMaterialIds = Object.entries(materialDifference.count).filter(
        ([_, count]) => (count ?? 0) > 0
    );

    for (const [materialTemplateId, count] of unusedMaterialIds) {
        const materialIdsToRemove = Object.keys(oldVehicle.materialIds)
            .filter(
                (materialId) =>
                    draftState.materials[materialId]?.templateId ===
                    materialTemplateId
            )
            .slice(0, count); // Only remove as many materials as the count indicates

        for (const materialId of materialIdsToRemove) {
            delete draftState.materials[materialId];
        }
    }

    // PERSONNEL

    const personnelDifference = findIdArrayDifferences(
        Object.keys(oldVehicle.personnelIds)
            .map((id) => draftState.personnel[id]?.templateId)
            .filter((id): id is string => !!id),
        replacement.personnelTemplateIds
    );

    const addedPersonnelTemplateIds = Object.entries(
        personnelDifference.count
    ).filter(([_, count]) => (count ?? 0) < 0);

    mutableReplacement.personnelTemplateIds = [];
    for (const [personnelTemplateId, count] of addedPersonnelTemplateIds) {
        for (let i = 0; i < Math.abs(count!); i++) {
            mutableReplacement.personnelTemplateIds.push(personnelTemplateId);
        }
    }

    const unusedPersonnelIds = Object.entries(personnelDifference.count).filter(
        ([_, count]) => (count ?? 0) > 0
    );

    for (const [personnelTemplateId, count] of unusedPersonnelIds) {
        const personnelIdsToRemove = Object.keys(oldVehicle.personnelIds)
            .filter(
                (personnelId) =>
                    draftState.personnel[personnelId]?.templateId ===
                    personnelTemplateId
            )
            .slice(0, count); // Only remove as many materials as the count indicates

        for (const personnelId of personnelIdsToRemove) {
            delete draftState.personnel[personnelId];
        }
    }

    return mutableReplacement;
}

function addNewAccessories(
    draftState: WritableDraft<ExerciseState>,
    newVehicle: Immutable<Vehicle>,
    newMaterial: Immutable<Material>[],
    newPersonnel: Immutable<Personnel>[]
) {
    for (const material of cloneDeepMutable(newMaterial)) {
        changePosition(
            material,
            newVehiclePositionIn(newVehicle.id),
            draftState
        );
        draftState.materials[material.id] = material;
    }
    for (const person of cloneDeepMutable(newPersonnel)) {
        changePosition(person, newVehiclePositionIn(newVehicle.id), draftState);
        draftState.personnel[person.id] = person;
    }
}

function updateVehicleOnMap(
    draftState: WritableDraft<ExerciseState>,
    elementId: UUID,
    replacement: Immutable<VehicleTemplate>,
    editElement: (newElement: Vehicle) => Vehicle = (element) => element
) {
    const oldVehicle = getElement(draftState, 'vehicle', elementId);
    const replacementVehicle = removeUnusedAccessories(
        draftState,
        oldVehicle,
        replacement
    );

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
            replacementVehicle.id,
            replacementVehicle,
            materialTemplates,
            personnelTemplates,
            newMapCoordinatesAt(0, 0),
            replacementVehicle.entity,
            true
        )
    );

    newElement.vehicle.id = elementId;
    newElement.vehicle.position = oldVehicle.position;

    draftState.vehicles[elementId] = editElement(
        cloneDeepMutable(newElement.vehicle)
    );

    addNewAccessories(
        draftState,
        newElement.vehicle,
        Object.values(newElement.materials),
        Object.values(newElement.personnel)
    );
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
                        replacement,
                        undefined
                    );
                    break;
                }
            }
        } else if (changeApply.type === 'editable') {
            switch (changeApply.action) {
                case 'keep': {
                    const existingVehicle = getElement(
                        state,
                        'vehicle',
                        changeApply.target.elementId
                    );
                    updateVehicleOnMap(
                        state,
                        changeApply.target.elementId,
                        changeApply.marketplaceElement
                            .content as VehicleTemplate,
                        (vehicle) => {
                            let newVehicle = vehicle;
                            for (const checker of getEditableValueCheckers(
                                'vehicle',
                                'vehicleTemplate'
                            )) {
                                newVehicle = checker.keep({
                                    template: changeApply.marketplaceElement
                                        .content as VehicleTemplate,
                                    oldElement: existingVehicle,
                                    newElement: newVehicle,
                                });
                            }
                            return newVehicle;
                        }
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
                case 'replace': {
                    const existingVehicle = getElement(
                        state,
                        'vehicle',
                        changeApply.target.elementId
                    );
                    updateVehicleOnMap(
                        state,
                        changeApply.target.elementId,
                        changeApply.marketplaceElement
                            .content as VehicleTemplate,
                        (vehicle) => {
                            let newVehicle = vehicle;
                            for (const checker of getEditableValueCheckers(
                                'vehicle',
                                'vehicleTemplate'
                            )) {
                                newVehicle = checker.replace({
                                    template: changeApply.marketplaceElement
                                        .content as VehicleTemplate,
                                    oldElement: existingVehicle,
                                    newElement: newVehicle,
                                    newContent: changeApply.newContent,
                                });
                            }

                            return newVehicle;
                        }
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
                    template: change.new.content,
                    element: cloneDeepMutable(affectedVehicle),
                });

                if (editedValues.length > 0) {
                    for (const editedValue of editedValues) {
                        impacts.push({
                            id: uuid(),
                            type: 'updated',
                            entity: change.new,
                            editedValue,
                            element: affectedVehicle,
                            target: newChangeMapTarget(
                                'vehicle',
                                affectedVehicle.id
                            ),
                        } satisfies EditableElementChangeImpact);
                    }
                }
            }

            console.log('Impacts for vehicle template update:', impacts);
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
