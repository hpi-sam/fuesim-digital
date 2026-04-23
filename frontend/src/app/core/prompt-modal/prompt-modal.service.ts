import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { PromptModalComponent } from './prompt-modal.component';

@Injectable({
    providedIn: 'root',
})
export class PromptModalService {
    private readonly ngbModalService = inject(NgbModal);

    /**
     * @returns a Promise that resolves to the result of the confirmationModal
     * true - the action has been confirmed
     * false - the action has been dismissed
     * null - the modal has been closed (cross/click on background/Esc)
     */
    public async prompt(options: PromptOptions) {
        const modalRef = this.ngbModalService.open(PromptModalComponent);
        const componentInstance =
            modalRef.componentInstance as PromptModalComponent;
        componentInstance.title = options.title;
        componentInstance.description = options.description;
        componentInstance.confirmationButtonText =
            options.confirmationButtonText ?? 'OK';
        return firstValueFrom(componentInstance.confirmation$);
    }
}

export interface PromptOptions {
    title: string;
    description: string;
    confirmationButtonText?: string;
}
