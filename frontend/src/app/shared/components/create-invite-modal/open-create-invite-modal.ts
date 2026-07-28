import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateInviteModalComponent } from './create-invite-modal.component';

export function openCreateInviteModal(
    ngbModalService: NgbModal,
    opts: {
        title: string;
        description: string;
        type: string;
        createInviteFn: () => Promise<string>;
    }
) {
    const modalRef = ngbModalService.open(CreateInviteModalComponent);
    const componentInstance =
        modalRef.componentInstance as CreateInviteModalComponent;
    componentInstance.titleText = opts.title;
    componentInstance.descriptionText = opts.description;
    componentInstance.typeText = opts.type;
    componentInstance.createInviteFn = opts.createInviteFn;
}
