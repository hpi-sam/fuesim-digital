import type { AfterViewInit } from '@angular/core';
import { Directive, ElementRef, inject, input } from '@angular/core';

/**
 * This directive focuses the element once after it has been initialized.
 * The html native autofocus attribute only gets checked when the page loads.
 *
 * Use it like this:
 *
 * ```html
 * <input type="text" [appAutofocus]="true" />
 * ```
 *
 * @param appAutofocus Whether to focus the element or not (to conditionally enable or disable it).
 *
 * If multiple autofocus directives are used on elements, that are loaded at the same time, it leads to a race condition.
 */
@Directive({
    selector: '[appAutofocus]',
    standalone: false,
})
// See https://netbasal.com/autofocus-that-works-anytime-in-angular-apps-68cb89a3f057
// and https://jhapriti09.medium.com/autofocus-directive-that-works-in-angular-10-db352ef70399
export class AutofocusDirective implements AfterViewInit {
    private readonly elementRef = inject(ElementRef);

    public readonly appAutofocus = input(true);

    public ngAfterViewInit() {
        if (this.appAutofocus()) {
            this.elementRef.nativeElement.focus();
        }
    }
}
