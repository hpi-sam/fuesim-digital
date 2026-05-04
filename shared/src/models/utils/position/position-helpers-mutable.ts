import type { WritableDraft } from 'immer';
import type { ExerciseState } from '../../../state.js';
import {
    removeTreatmentsOfElement,
    updateTreatments,
} from '../../../store/action-reducers/utils/calculate-treatments.js';
import type { SpatialElementType } from '../../../store/action-reducers/utils/spatial-elements.js';
import {
    removeElementPosition,
    updateElementPosition,
} from '../../../store/action-reducers/utils/spatial-elements.js';
import { checkRestrictedVehicleMovementOrThrow } from '../../../store/action-reducers/utils/restricted-vehicle-movement.js';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from '../../element.js';
import type { AlarmGroup } from '../../alarm-group.js';
import type { Client } from '../../client.js';
import type { Hospital } from '../../hospital.js';
import type { Scoutable } from '../../scoutable.js';
import type { UserGeneratedContent } from '../../user-generated-content.js';
import type { UUID } from '../../../utils/uuid.js';
import { getElement } from '../../../store/action-reducers/utils/get-element.js';
import { cloneDeepMutable } from '../../../utils/clone-deep.js';
import type { Task } from '../../task.js';
import type { MapCoordinates } from './map-coordinates.js';
import type { MapPosition } from './map-position.js';
import { newMapPositionAt } from './map-position.js';
import type { Position } from './position.js';
import {
    coordinatesOfPosition,
    isPositionOnMap,
    isOnMap,
    currentCoordinatesOf,
    calculateDelta,
} from './position-helpers.js';
import type { WithPosition } from './with-position.js';
import { EvalCriterion } from '../../evaluation-criterion.js';

type MovableElement = Exclude<
    Element,
    | AlarmGroup
    | Client
    | Hospital
    | Scoutable
    | Task
    | UserGeneratedContent
    | EvalCriterion
>;
type MovableType = MovableElement['type'];

export function changePositionWithId(
    of: UUID,
    to: Position,
    type: MovableType,
    inState: WritableDraft<ExerciseState>
) {
    changePosition(getElement(inState, type, of), to, inState);
}

export function changePosition(
    element: WritableDraft<MovableElement>,
    to: Position,
    state: WritableDraft<ExerciseState>
) {
    if (
        element.type === 'patient' ||
        element.type === 'personnel' ||
        element.type === 'material'
    ) {
        updateSpatialElementTree(element, to, element.type, state);
        if (element.position.type !== to.type) {
            removeTreatmentsOfElement(state, element);
        }
        element.position = cloneDeepMutable(to);
        updateTreatments(state, element);
        return;
    }
    if (element.type === 'vehicle') {
        checkRestrictedVehicleMovementOrThrow(
            state,
            element,
            element.position,
            to
        );
    }
    if (element.type === 'technicalChallenge' && to.type === 'coordinates') {
        const assignedPersonnel = Object.keys(element.assignedPersonnel).map(
            (id) => getElement(state, 'personnel', id)
        );
        moveAssociatedElements(element, to, assignedPersonnel, state);
    }
    element.position = cloneDeepMutable(to);
}

/**
 * Helper to move {@link associatedElements} of an {@link element} relatively
 * to it, if itself is moved to {@link to} by changing their position by the
 * same movement vector.
 *
 * {@link element} is not moved.
 */
function moveAssociatedElements(
    element: WithPosition,
    to: MapPosition,
    associatedElements: WritableDraft<MovableElement>[],
    state: WritableDraft<ExerciseState>
) {
    const from = currentCoordinatesOf(element);
    const delta = calculateDelta(from, coordinatesOfPosition(to));
    const move = (position: Position): Position => {
        if (!isPositionOnMap(position)) return position;
        const coordinates = coordinatesOfPosition(position);

        return newMapPositionAt({
            x: coordinates.x + delta.deltaX,
            y: coordinates.y + delta.deltaY,
        });
    };
    for (const associatedElement of associatedElements) {
        changePosition(
            associatedElement,
            move(associatedElement.position),
            state
        );
    }
}

function updateSpatialElementTree(
    element: WritableDraft<MovableElement>,
    to: Position,
    type: SpatialElementType,
    state: WritableDraft<ExerciseState>
) {
    if (isOnMap(element) && isPositionOnMap(to)) {
        updateElementPosition(
            state,
            type,
            element.id,
            coordinatesOfPosition(to)
        );
    } else if (isOnMap(element) && !isPositionOnMap(to)) {
        removeElementPosition(state, type, element.id);
    } else if (!isOnMap(element) && isPositionOnMap(to)) {
        updateElementPosition(
            state,
            type,
            element.id,
            coordinatesOfPosition(to)
        );
    }
}

export function offsetMapPositionBy(
    position: WritableDraft<MapPosition>,
    offset: MapCoordinates
) {
    position.coordinates.x += offset.x;
    position.coordinates.y += offset.y;
}
