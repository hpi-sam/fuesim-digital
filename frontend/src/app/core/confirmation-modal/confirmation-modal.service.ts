import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { ConfirmationModalComponent } from './confirmation-modal.component';

@Injectable({
    providedIn: 'root',
})
export class ConfirmationModalService {
    constructor(private readonly ngbModalService: NgbModal) {}

    /**
     * @returns a Promise that resolves to the result of the confirmationModal
     * true - the action has been confirmed
     * false - the action has been dismissed
     * null - the modal has been closed (cross/click on background/Esc)
     */
    public async confirm(options: ConfirmationOptions) {
        const modalRef = this.ngbModalService.open(ConfirmationModalComponent);
        const componentInstance =
            modalRef.componentInstance as ConfirmationModalComponent;
        componentInstance.title = options.title;
        componentInstance.description = options.description;
        componentInstance.confirmationString = options.confirmationString;
        return firstValueFrom(componentInstance.confirmation$, {
            defaultValue: false,
        });
    }
}

export interface ConfirmationOptions {
    title: string;
    description: string;
    /**
     * A string that must be manually entered to confirm the action
     */
    confirmationString?: string;
}
