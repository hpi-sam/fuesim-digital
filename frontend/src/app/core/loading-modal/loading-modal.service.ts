import { Injectable, inject } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { LoadingModalComponent } from './loading-modal.component';

@Injectable({
    providedIn: 'root',
})
export class LoadingModalService {
    private readonly ngbModalService = inject(NgbModal);

    private loadingModalRef: NgbModalRef | null = null;

    /**
     * @returns a Promise that resolves to the result of the confirmationModal
     * true - the action has been confirmed
     * false - the action has been dismissed
     * null - the modal has been closed (cross/click on background/Esc)
     */
    public async showLoading(options: LoadingOptions) {
        this.loadingModalRef ??= this.ngbModalService.open(
            LoadingModalComponent,
            {
                // do not close on backdrop click
                backdrop: 'static',
            }
        );
        const componentInstance = this.loadingModalRef
            .componentInstance as LoadingModalComponent;
        componentInstance.title = options.title;
        componentInstance.description = options.description;
    }

    public async closeLoading() {
        this.loadingModalRef?.close();
        this.loadingModalRef = null;
    }
}

export interface LoadingOptions {
    title: string;
    description: string;
}
