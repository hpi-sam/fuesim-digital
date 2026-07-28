import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { SelectOrganisationModalComponent } from './select-organisation-modal.component';

export async function openSelectOrganisationModal(
    ngbModalService: NgbModal,
    opts: {
        descriptionText: string;
    }
) {
    const modalRef = ngbModalService.open(SelectOrganisationModalComponent, {
        size: 'md',
    });

    const componentInstance =
        modalRef.componentInstance as SelectOrganisationModalComponent;
    componentInstance.descriptionText = opts.descriptionText;
    return firstValueFrom(componentInstance.selected$);
}
