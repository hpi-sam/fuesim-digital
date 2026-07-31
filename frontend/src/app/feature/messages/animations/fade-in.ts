import type {
    AnimationTransitionMetadata,
    AnimationTriggerMetadata,
} from '@angular/animations';
import { animate, style, transition, trigger } from '@angular/animations';

/**
 * @param duration time in ms
 * Fade in on :enter
 */
export function fadeIn(duration?: number): AnimationTriggerMetadata {
    return trigger('fadeIn', [fadeInTransition(duration)]);
}

/**
 * @param duration time in ms
 * Fade in on :enter
 */
export function fadeInTransition(duration = 500): AnimationTransitionMetadata {
    return transition(':enter', [
        style({ opacity: '0' }),
        animate(`${duration}ms ease-out`, style({ opacity: '1' })),
    ]);
}
