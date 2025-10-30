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
import type { Mutable, UUID } from '../../../utils/index.js';
import { cloneDeepMutable } from '../../../utils/index.js';
import type { MapCoordinates } from './map-coordinates.js';
import type { MapPosition } from './map-position.js';
import type { Position } from './position.js';
import {
    coordinatesOfPosition,
    isPositionOnMap,
    isOnMap,
} from './position-helpers.js';

type MutablePosition = Mutable<Position>;

interface WithMutablePosition {
    position: MutablePosition;
    type: MovableType;
}
interface WithMutablePositionAndId extends WithMutablePosition {
    id: UUID;
}
type MovableType =
    | 'alarmGroup'
    | 'client'
    | 'hospital'
    | 'mapImage'
    | 'material'
    | 'patient'
    | 'personnel'
    | 'restrictedZone'
    | 'simulatedRegion'
    | 'transferPoint'
    | 'vehicle'
    | 'viewport';

export function changePositionWithId(
    of: UUID,
    to: Position,
    type: MovableType,
    inState: Mutable<ExerciseState>
) {
    changePosition(getElement(inState, type, of) as any, to, inState);
}

export function changePosition(
    element: WithMutablePosition,
    to: Position,
    state: Mutable<ExerciseState>
) {
    if (
        element.type === 'patient' ||
        element.type === 'personnel' ||
        element.type === 'material'
    ) {
        updateSpatialElementTree(
            element as WithMutablePositionAndId,
            to,
            element.type,
            state
        );
        if (element.position.type !== to.type) {
            removeTreatmentsOfElement(state, element as any);
        }
        element.position = cloneDeepMutable(to);
        updateTreatments(state, element as any);
        return;
    }
    element.position = cloneDeepMutable(to);
}

function updateSpatialElementTree(
    element: WithMutablePositionAndId,
    to: Position,
    type: SpatialElementType,
    state: Mutable<ExerciseState>
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
    position: Mutable<MapPosition>,
    offset: MapCoordinates
) {
    position.coordinates.x += offset.x;
    position.coordinates.y += offset.y;
}
