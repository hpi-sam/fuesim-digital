import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientsModalComponent } from './clients-modal.component';

export function openInviteModal(ngbModalService: NgbModal) {
    const modalRef = ngbModalService.open(ClientsModalComponent, {
        size: 'm',
    });
    modalRef.componentInstance.shareRole.set('participant');
}

export function openClientsModal(ngbModalService: NgbModal) {
    const modalRef = ngbModalService.open(ClientsModalComponent, {
        size: 'lg',
    });
    modalRef.componentInstance.showTable.set(true);
}

export function openParticipantsModal(ngbModalService: NgbModal) {
    const modalRef = ngbModalService.open(ClientsModalComponent, {
        size: 'xl',
    });
    modalRef.componentInstance.shareRole.set('participant');
    modalRef.componentInstance.showTable.set(true);
}

export function openTrainersModal(ngbModalService: NgbModal) {
    const modalRef = ngbModalService.open(ClientsModalComponent, {
        size: 'm',
    });
    modalRef.componentInstance.shareRole.set('trainer');
}
