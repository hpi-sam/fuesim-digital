import type { AnimationTriggerMetadata } from '@angular/animations';
import { trigger } from '@angular/animations';
import { fadeInTransition } from './fade-in.js';
import { fadeOutTransition } from './fade-out.js';

/**
 * @param duration time in ms
 * Fade in on :enter, fade out on :leave
 */
export function fade(duration?: number): AnimationTriggerMetadata {
    return trigger('fade', [
        fadeInTransition(duration),
        fadeOutTransition(duration),
    ]);
}
