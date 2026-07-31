import type {
    AnimationTransitionMetadata,
    AnimationTriggerMetadata,
} from '@angular/animations';
import { animate, style, transition, trigger } from '@angular/animations';

/**
 * @param duration time in ms
 * Fade out on :leave
 */
export function fadeOut(duration?: number): AnimationTriggerMetadata {
    return trigger('fadeOut', [fadeOutTransition(duration)]);
}

/**
 * @param duration time in ms
 * Fade out on :leave
 */
export function fadeOutTransition(duration = 500): AnimationTransitionMetadata {
    return transition(':leave', [
        style({ opacity: '1' }),
        animate(`${duration}ms ease-out`, style({ opacity: '0' })),
    ]);
}
