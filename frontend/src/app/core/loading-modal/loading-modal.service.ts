import { Injectable, inject } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { LoadingModalComponent } from './loading-modal.component';

@Injectable({
    providedIn: 'root',
})
export class LoadingModalService {
    private readonly ngbModalService = inject(NgbModal);

    private isLoadingModalOpen = false;
    private loadingModalRef: NgbModalRef | null = null;

    /**
     * @returns a Promise that resolves to the result of the confirmationModal
     * true - the action has been confirmed
     * false - the action has been dismissed
     * null - the modal has been closed (cross/click on background/Esc)
     */
    public async showLoading(options: LoadingOptions) {
        const modalRef = this.ngbModalService.open(LoadingModalComponent, {
            // do not close on backdrop click
            backdrop: 'static',
        });
        const componentInstance =
            modalRef.componentInstance as LoadingModalComponent;
        componentInstance.title = options.title;
        componentInstance.description = options.description;

        this.isLoadingModalOpen = true;
        this.loadingModalRef = modalRef;
    }

    public async closeLoading() {
        this.loadingModalRef?.close();
        this.isLoadingModalOpen = false;
    }
}

export interface LoadingOptions {
    title: string;
    description: string;
}
