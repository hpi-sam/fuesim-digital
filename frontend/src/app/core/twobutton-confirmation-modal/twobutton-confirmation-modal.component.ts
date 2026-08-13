import type { OnDestroy } from '@angular/core';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-twobutton-confirmation-modal',
    templateUrl: './twobutton-confirmation-modal.component.html',
    styleUrls: ['./twobutton-confirmation-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule],
})
export class TwoButtonConfirmationModalComponent implements OnDestroy {
    readonly activeModal = inject(NgbActiveModal);

    public title = '';
    public description = '';
    /**
     * Emits when the modal closes
     * null - the action has been aborted
     */
    public confirmation$ = new Subject<'danger' | 'success' | null>();

    public dangerButtonText = 'OK';

    public successButtonText: string | undefined = undefined;

    public cancelButtonText = 'Abbrechen';

    ngOnDestroy() {
        this.confirmation$.complete();
    }
}
