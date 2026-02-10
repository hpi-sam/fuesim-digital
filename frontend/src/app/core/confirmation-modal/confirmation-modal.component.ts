import type { OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.scss'],
    standalone: false,
})
export class ConfirmationModalComponent implements OnDestroy {
    readonly activeModal = inject(NgbActiveModal);

    public title = '';
    public description = '';
    /**
     * If defined the user has to type in the specified string to be able to confirm the action
     */
    public confirmationString?: string;
    /**
     * Emits when the modal closes
     * true - the action has been confirmed
     * false - the action has been dismissed
     * null - the modal has been closed (cross/click on background/Esc)
     */
    public confirmation$ = new Subject<boolean | null>();

    public confirmationStringValue = '';

    ngOnDestroy() {
        this.confirmation$.complete();
    }
}
