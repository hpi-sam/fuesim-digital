import type { OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../shared/directives/autofocus.directive';
import { ExactMatchValidatorDirective } from '../../shared/validation/exact-match-validator.directive';
import { DisplayValidationComponent } from '../../shared/validation/display-validation/display-validation.component';

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './prompt-modal.component.html',
    styleUrls: ['./prompt-modal.component.scss'],
    imports: [
        FormsModule,
        AutofocusDirective,
        ExactMatchValidatorDirective,
        DisplayValidationComponent,
    ],
})
export class PromptModalComponent implements OnDestroy {
    readonly activeModal = inject(NgbActiveModal);

    public title = '';
    public description = '';
    /**
     * Emits when the modal closes
     * string - the action has been confirmed with the string value as result
     * false - the action has been dismissed
     * null - the modal has been closed (cross/click on background/Esc)
     */
    public confirmation$ = new Subject<
        { result: false | null; value: null } | { result: true; value: string }
    >();

    public confirmationStringValue = '';

    public confirmationButtonText = 'OK';

    public confirm(result: boolean | null) {
        if (result) {
            this.confirmation$.next({
                result,
                value: this.confirmationStringValue,
            });
        } else {
            this.confirmation$.next({ result, value: null });
        }
        this.activeModal.close();
    }

    ngOnDestroy() {
        this.confirmation$.complete();
    }
}
