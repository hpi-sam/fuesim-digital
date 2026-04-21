import { freeze, isDraft, type WritableDraft } from 'immer';
import type { ExerciseState } from '../../../state.js';
import type { ElementTypePluralMap } from '../../../utils/element-type-plural-map.js';
import { elementTypePluralMap } from '../../../utils/element-type-plural-map.js';
import { ReducerError } from '../../reducer-error.js';
import { newUserGeneratedContent } from '../../../models/user-generated-content.js';
import type { UUID } from '../../../utils/uuid.js';
import type { ExerciseRadiogram } from '../../../models/radiogram/exercise-radiogram.js';
import type {
    ExerciseSimulationBehaviorState,
    ExerciseSimulationBehaviorType,
} from '../../../simulation/behaviors/exercise-simulation-behavior.js';
import type {
    ExerciseSimulationActivityState,
    ExerciseSimulationActivityType,
} from '../../../simulation/activities/exercise-simulation-activity.js';

/**
 * @returns The element with the given id
 * @throws ReducerError if the element does not exist
 */
export function getElement<
    ElementType extends keyof ElementTypePluralMap,
    State extends ExerciseState | WritableDraft<ExerciseState>,
>(
    state: State,
    elementType: ElementType,
    elementId: UUID
): State[ElementTypePluralMap[ElementType]][UUID] {
    const element = tryGetElement(state, elementType, elementId);
    if (!element) {
        // Undefined UserGeneratedContent is always assumed to be an existing empty content.
        if (elementType === 'userGeneratedContent') {
            const content = newUserGeneratedContent(elementId);
            if (isDraft(state)) {
                return content as State[ElementTypePluralMap[ElementType]][UUID];
            }
            return freeze(
                content,
                true
            ) as State[ElementTypePluralMap[ElementType]][UUID];
        }
        throw new ReducerError(
            `Element of type ${elementType} with id ${elementId} does not exist`
        );
    }
    return element;
}

/**
 * @returns The element with the given id, or undefined if it does not exist
 */
export function tryGetElement<
    ElementType extends keyof ElementTypePluralMap,
    State extends ExerciseState | WritableDraft<ExerciseState>,
>(state: State, elementType: ElementType, elementId: UUID) {
    return state[elementTypePluralMap[elementType]][elementId] as
        | State[ElementTypePluralMap[ElementType]][UUID]
        | undefined;
}

export function getElementByPredicate<
    ElementType extends keyof ElementTypePluralMap,
    State extends WritableDraft<ExerciseState>,
>(
    state: State,
    elementType: ElementType,
    predicate: (
        element: State[ElementTypePluralMap[ElementType]][UUID]
    ) => boolean
): State[ElementTypePluralMap[ElementType]][UUID] {
    const element = Object.values(
        state[elementTypePluralMap[elementType]]
    ).find(predicate);
    if (!element) {
        throw new ReducerError(
            `Element of type ${elementType} matching the given predicate does not exist`
        );
    }
    return element;
}

export function getExerciseRadiogramById(
    state: WritableDraft<ExerciseState>,
    radiogramId: UUID
) {
    const radiogram = state.radiograms[radiogramId];
    if (!radiogram) {
        throw new ReducerError(
            `Radiogram with id ${radiogramId} does not exist`
        );
    }
    return radiogram;
}

export function getRadiogramById<R extends ExerciseRadiogram>(
    state: WritableDraft<ExerciseState>,
    radiogramId: UUID,
    radiogramType: R['type']
) {
    const radiogram = state.radiograms[radiogramId];
    if (!radiogram) {
        throw new ReducerError(
            `Radiogram with id ${radiogramId} does not exist`
        );
    }
    if (radiogram.type !== radiogramType) {
        throw new ReducerError(
            `Expected radiogram with id ${radiogramId} to be of type ${radiogramType}, but was ${radiogram.type}`
        );
    }
    return radiogram as WritableDraft<R>;
}

export function getExerciseBehaviorById(
    state: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorId: UUID
) {
    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );
    const behavior = simulatedRegion.behaviors.find((b) => b.id === behaviorId);
    if (!behavior) {
        throw new ReducerError(
            `Behavior with id ${behaviorId} does not exist in simulated region ${simulatedRegionId}`
        );
    }
    return behavior;
}

export function getBehaviorById<T extends ExerciseSimulationBehaviorType>(
    state: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorId: UUID,
    behaviorType: T
) {
    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );
    const behavior = simulatedRegion.behaviors.find((b) => b.id === behaviorId);
    if (!behavior) {
        throw new ReducerError(
            `Behavior with id ${behaviorId} does not exist in simulated region ${simulatedRegionId}`
        );
    }
    if (behavior.type !== behaviorType) {
        throw new ReducerError(
            `Expected behavior with id ${behaviorId} to be of type ${behaviorType}, but was ${behavior.type}`
        );
    }
    return behavior as WritableDraft<
        ExerciseSimulationBehaviorState & { type: T }
    >;
}

export function getActivityById<T extends ExerciseSimulationActivityType>(
    state: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    activityId: UUID,
    activityType: T
) {
    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );
    const activity = simulatedRegion.activities[activityId];
    if (!activity) {
        throw new ReducerError(
            `Activity with id ${activityId} does not exist in simulated region ${simulatedRegionId}`
        );
    }
    if (activity.type !== activityType) {
        throw new ReducerError(
            `Expected activity with id ${activityId} to be of type ${activityType}, but was ${activity.type}`
        );
    }
    return activity as WritableDraft<
        ExerciseSimulationActivityState & { type: T }
    >;
}
