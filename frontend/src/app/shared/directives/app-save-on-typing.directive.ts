import type { OnDestroy } from '@angular/core';
import { Directive, inject, output } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Subject, debounceTime, filter, takeUntil, tap } from 'rxjs';
import { isBeingTestedByCypress } from '../functions/cypress';

/**
 * This directive should be used when values should be autosaved while the user types into the input.
 * The emitted event is the value that should be saved.
 * It is already checked for validity (form Validators) and the type events are debounced.
 *
 * @example
 * ```html
 * <input
 *   [ngModel]="myValue"
 *   (appSaveOnTyping)="myValueHasChangedAndIsValid($event)"
 *   required
 *   type="text"
 * />
 *
 * ```
 *
 * Inspired by https://stackoverflow.com/a/65079996
 */
@Directive({
    selector: '[appSaveOnTyping][ngModel]',
    standalone: false,
})
export class AppSaveOnTypingDirective implements OnDestroy {
    destroy$ = new Subject<void>();
    readonly appSaveOnTyping = output<any>();

    private lastInputValue?: any;
    private lastInputValueWasValid = false;
    private lastSubmittedValue?: any;

    constructor() {
        const ngModel = inject(NgModel);

        ngModel.update
            .pipe(
                tap((value) => {
                    this.lastInputValue = value;
                    this.lastInputValueWasValid = ngModel.valid === true;
                }),
                // Keeping a key (like backspace) pressed for a more than a certain threshold will result in many key presses
                // The debounceTime should be above that threshold to not register the initial keypress as the first update
                isBeingTestedByCypress() ? tap() : debounceTime(600),
                filter(() => ngModel.valid === true),
                takeUntil(this.destroy$)
            )
            .subscribe((value) => {
                if (this.lastSubmittedValue === value) {
                    // We don't want to emit the same value twice in a row
                    return;
                }
                this.lastSubmittedValue = value;
                this.appSaveOnTyping.emit(value);
            });
    }

    ngOnDestroy() {
        if (
            this.lastInputValueWasValid &&
            this.lastInputValue !== this.lastSubmittedValue
        ) {
            // The last input value was not submitted yet
            // We want to emit this last value before the appSaveOnTyping gets
            // unsubscribed from during the destruction of the parent component
            this.appSaveOnTyping.emit(this.lastInputValue);
        }
        this.destroy$.next();
    }
}
