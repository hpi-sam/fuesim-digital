import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { TwoButtonConfirmationModalComponent } from './twobutton-confirmation-modal.component';

@Injectable({
    providedIn: 'root',
})
export class TwoButtonConfirmationModalService {
    private readonly ngbModalService = inject(NgbModal);

    /**
     * @returns a Promise that resolves to the result of the confirmationModal
     * true - the action has been confirmed
     * false - the action has been dismissed
     * null - the modal has been closed (cross/click on background/Esc)
     */
    public async confirm(options: TwoButtonConfirmationOptions) {
        const modalRef = this.ngbModalService.open(
            TwoButtonConfirmationModalComponent
        );
        const componentInstance =
            modalRef.componentInstance as TwoButtonConfirmationModalComponent;
        componentInstance.title = options.title;
        componentInstance.description = options.description;
        componentInstance.successButtonText =
            options.successConfirmationButtonText;
        componentInstance.dangerButtonText =
            options.dangerConfirmationButtonText ?? 'OK';
        componentInstance.cancelButtonText =
            options.cancelButtonText ?? 'Abbrechen';
        return firstValueFrom(componentInstance.confirmation$, {
            defaultValue: null,
        });
    }
}

export interface TwoButtonConfirmationOptions {
    title: string;
    description: string;
    /**
     * A string that must be manually entered to confirm the action
     */
    dangerConfirmationButtonText?: string;
    successConfirmationButtonText?: string;
    cancelButtonText?: string;
}
