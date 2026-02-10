import {
    Directive,
    Input,
    TemplateRef,
    ViewContainerRef,
    inject,
} from '@angular/core';

interface LetContext<T> {
    appLet: T;
    $implicit: T;
}

/**
 * A structural directive that allows to declare variables in a template (without not rendering the template like with `*ngIf`).
 * @example
 * ```html
 * <div *appLet="value$ | async as value">
 *    <p>{{ value }}</p>
 * </div>
 * ```
 *
 * See https://github.com/angular/angular/issues/15280 for the official issue
 * See https://github.com/nigrosimone/ng-let/blob/main/projects/ng-let/src/lib/ng-let.directive.ts for the implementation
 */
@Directive({
    selector: '[appLet]',
    standalone: false,
})
export class LetDirective<T> {
    private readonly viewContainer = inject(ViewContainerRef);
    private readonly templateRef =
        inject<TemplateRef<LetContext<T>>>(TemplateRef);

    @Input()
    set appLet(value: T) {
        this.context.$implicit = this.context.appLet = value;
        if (!this.hasView) {
            this.viewContainer.createEmbeddedView(
                this.templateRef,
                this.context
            );
            this.hasView = true;
        }
    }

    private readonly context: LetContext<T | null> = {
        appLet: null,
        $implicit: null,
    };
    private hasView = false;

    /**
     * Assert the correct type of the expression bound to the `AppLet` input within the template.
     *
     * The presence of this static field is a signal to the Ivy template type check compiler that
     * when the `AppLet` structural directive renders its template, the type of the expression bound
     * to `AppLet` should be narrowed in some way. For `AppLet`, the binding expression itself is used to
     * narrow its type, which allows the strictNullChecks feature of TypeScript to work with `AppLet`.
     */
    static ngTemplateGuard_appLet: 'binding';

    /**
     * Asserts the correct type of the context for the template that `AppLet` will render.
     *
     * The presence of this method is a signal to the Ivy template type-check compiler that the
     * `AppLet` structural directive renders its template with a specific context type.
     */
    static ngTemplateContextGuard<T>(
        dir: LetDirective<T>,
        ctx: any
    ): ctx is LetContext<Exclude<T, '' | 0 | false | null | undefined>> {
        return true;
    }
}
