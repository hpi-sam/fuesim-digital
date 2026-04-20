import type { OnDestroy } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-loading-modal',
    templateUrl: './loading-modal.component.html',
    styleUrls: ['./loading-modal.component.scss'],
    imports: [FormsModule],
})
export class LoadingModalComponent implements OnDestroy {
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

    public confirmationButtonText = 'OK';

    ngOnDestroy() {
        this.confirmation$.complete();
    }
}
