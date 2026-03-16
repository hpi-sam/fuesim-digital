import type { WritableDraft } from 'immer';
import type { ExerciseState } from '../../../state.js';
import { getElement } from '../../../store/action-reducers/utils/index.js';
import {
    removeTreatmentsOfElement,
    updateTreatments,
} from '../../../store/action-reducers/utils/calculate-treatments.js';
import type { SpatialElementType } from '../../../store/action-reducers/utils/spatial-elements.js';
import {
    removeElementPosition,
    updateElementPosition,
} from '../../../store/action-reducers/utils/spatial-elements.js';
import type { UUID } from '../../../utils/index.js';
import { cloneDeepMutable } from '../../../utils/index.js';
import { checkRestrictedVehicleMovementOrThrow } from '../../../store/action-reducers/utils/restricted-vehicle-movement.js';
// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from '../../element.js';
import type { AlarmGroup } from '../../alarm-group.js';
import type { Client } from '../../client.js';
import type { Hospital } from '../../hospital.js';
import type { MapCoordinates } from './map-coordinates.js';
import type { MapPosition } from './map-position.js';
import type { Position } from './position.js';
import {
    coordinatesOfPosition,
    isPositionOnMap,
    isOnMap,
} from './position-helpers.js';

type MovableElement = Exclude<Element, AlarmGroup | Client | Hospital>;
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
    element.position = cloneDeepMutable(to);
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
